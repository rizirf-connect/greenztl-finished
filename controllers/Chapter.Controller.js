// chapter.controller.js
import { chapterService } from "../services/Chapter.Service.js";
import { convertFileToRichText } from "../helpers/richTextMaker.js";
import { google } from "googleapis";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import mammoth from "mammoth";
import xlsx from "xlsx";
import { seriesService } from "../services/Series.Service.js";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, "KEY.json");
const serviceAccount = JSON.parse(fs.readFileSync(jsonPath));

// Authenticate using the service account
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

// Create a new chapter
export const createChapter = async (req, res) => {
  try {
    // Check if the file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const { name, seriesId, isPremium, price } = req.body;

    // Validate required fields
    if (!name || !seriesId) {
      return res
        .status(400)
        .json({ message: "Name and seriesId are required" });
    }

    const richTextContent = await convertFileToRichText(req.file.buffer);

    const chapterData = {
      title: name,
      content: richTextContent,
      seriesId,
      isPremium: isPremium || false,
      price: price || 0,
    };

    const chapter = await chapterService.create(chapterData);

    return res.status(201).json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read all chapters
export const getAllChapters = async (req, res) => {
  try {
    const { seriesId } = req.query;
    let chapters;

    if (seriesId) {
      chapters = await chapterService.model.find({ seriesId });
    } else {
      chapters = await chapterService.read();
    }

    res.status(200).json(chapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentlyUpdatedChapters = async (req, res) => {
  try {
    const chapters = await chapterService.model.aggregate([
      {
        $sort: { updatedAt: -1 },
      },
      {
        $group: {
          _id: "$seriesId",
          mostRecentChapter: { $first: "$$ROOT" },
        },
      },
      {
        $sort: { "mostRecentChapter.updatedAt": -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "series",
          localField: "_id",
          foreignField: "_id",
          as: "seriesInfo",
        },
      },
      {
        $unwind: "$seriesInfo",
      },
      {
        $project: {
          _id: "$seriesInfo._id",
          seriesName: "$seriesInfo.name",
          thumbnail: "$seriesInfo.thumbnail",
          type: "$seriesInfo.type",
          images: "$seriesInfo.images",
          chapterId: "$mostRecentChapter._id",
          chapterName: "$mostRecentChapter.title",
          updatedAt: "$mostRecentChapter.updatedAt",
        },
      },
    ]);

    res.status(200).json(chapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get Chapters for RSS feed
export const getChapterForRss = async (req, res) => {
  try {
    // Index for filtering fields
    const data = await chapterService.model.aggregate([
      // 1. Match the filters
      {
        $match: {
          isPremium: false,
          membersOnly: false,
          discordOnly: false
        }
      },

      // 2. Sort by 'updatedAt' in descending order
      {
        $sort: { updatedAt: -1 }
      },

      // 3. Lookup to populate the 'seriesId' field
      {
        $lookup: {
          from: 'series', // Correct collection name for the 'series' model
          localField: 'seriesId', // The field in the 'chapter' collection
          foreignField: '_id', // The _id field in the 'series' collection
          as: 'seriesInfo' // Name of the array field to store populated data
        }
      },

      // 4. Unwind the 'seriesInfo' array (to flatten it from an array to a document)
      {
        $unwind: {
          path: '$seriesInfo',
          preserveNullAndEmptyArrays: true // Allow chapters without a corresponding series
        }
      },

      // 5. Project only the necessary fields (seriesId, title, updatedAt, and series fields)
      {
        $project: {
          seriesId: 1, // Keep the original 'seriesId'
          title: 1, // Keep the 'title'
          updatedAt: 1, // Keep the 'updatedAt'
          'seriesInfo.name': 1, // Include 'name' field from the 'series' collection
          'seriesInfo.description': 1, // Include 'description' field from the 'series' collection
          'seriesInfo.thumbnail': 1, // Optionally, include 'thumbnail' if needed
          'seriesInfo.createdAt': 1, // Optionally, include 'createdAt' if needed
          'seriesInfo.updatedAt': 1 // Optionally, include 'updatedAt' if needed
        }
      }
    ]);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Read a chapter by ID
export const getChapterById = async (req, res) => {
  try {
    const chapterId = req.params.id;

    // Fetch the current chapter
    const currentChapter = await chapterService.readById(chapterId);
    if (!currentChapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const seriesId = currentChapter.seriesId;

    // Fetch the first and last chapters to handle edge cases
    const firstChapter = await chapterService.model
      .findOne({ seriesId })
      .sort({ createdAt: 1 }) // Ascending order (oldest)
      .select("_id");

    const lastChapter = await chapterService.model
      .findOne({ seriesId })
      .sort({ createdAt: -1 })
      .select("_id");

    const isFirstChapter = currentChapter._id.equals(firstChapter._id);
    const isLastChapter = currentChapter._id.equals(lastChapter._id);

    let previousChapter = null;
    let nextChapter = null;

    if (!isFirstChapter) {
      previousChapter = await chapterService.model
        .findOne({
          seriesId: seriesId,
          createdAt: { $lt: currentChapter.createdAt },
        })
        .sort({ createdAt: -1 });
    }

    if (!isLastChapter) {
      nextChapter = await chapterService.model
        .findOne({
          seriesId: seriesId,
          createdAt: { $gt: currentChapter.createdAt },
        })
        .sort({ createdAt: 1 });
    }

    res.status(200).json({
      currentChapter,
      previousChapter: previousChapter || null,
      nextChapter: nextChapter || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a chapter
export const updateChapter = async (req, res) => {
  try {
    const chapter = await chapterService.update(req.params.id, req.body);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }
    res.status(200).json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a chapter
export const deleteChapter = async (req, res) => {
  try {
    const chapter = await chapterService.delete(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }
    res.status(204).send(); // No content to send back
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const bulkUploadChapters = async (req, res) => {
//   try {
//     const { seriesId } = req.params;
//     const file = req.file;

//     if (!file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     // Read the Excel file
//     const workbook = xlsx.read(file.buffer, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];

//     // Convert the sheet to JSON format
//     const chapters = xlsx.utils.sheet_to_json(worksheet);

//     // Prepare chapters for bulk insertion
//     const chapterData = await Promise.all(
//       chapters.map(async (chapter) => {
//         console.log(chapter.content);
//         const contentHtml = convertTextToRichText(chapter.content);
//         console.log(contentHtml);
//         return {
//           title: chapter.name,
//           content: contentHtml,
//           seriesId,
//           isPremium: chapter.isPremium || false,
//           price: chapter.price || 0,
//         };
//       })
//     );

//     await chapterService.model.insertMany(chapterData);

//     return res.status(201).json({ message: "Chapters uploaded successfully" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

export const bulkUploadChapters = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Read the Excel file
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const chapters = xlsx.utils.sheet_to_json(worksheet);

    const chapterData = await Promise.all(
      chapters.map(async (chapter) => {
        let contentHtml = "";

        if (chapter.contentFileId) {
          try {
            // Fetch the .docx file from Google Drive
            const response = await drive.files.get(
              { fileId: chapter.contentFileId, alt: "media" },
              { responseType: "arraybuffer" }
            );

            const buffer = Buffer.from(response.data);

            // Use Mammoth to convert document content to HTML with embedded images
            const mammothResult = await mammoth.convertToHtml(
              { buffer },
              {
                convertImage: mammoth.images.inline(async (image) => {
                  const imageBuffer = await image.read("base64");
                  const extension = image.contentType.split("/")[1];
                  return {
                    src: `data:${image.contentType};base64,${imageBuffer}`,
                  };
                }),
              }
            );

            contentHtml = mammothResult.value;
          } catch (error) {
            console.error(
              `Error processing document for chapter "${chapter.name}":`,
              error
            );
            throw new Error("Error processing document link.");
          }
        }

        return {
          title: chapter.name,
          content: contentHtml,
          seriesId,
          isPremium: chapter.isPremium || false,
          price: chapter.price || 0,
        };
      })
    );

    await chapterService.model.insertMany(chapterData);
    return res.status(201).json({ message: "Chapters uploaded successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// update chapter to discord and members only
export const automateChapters = async () => {
  try {
    const series = await seriesService.model.find();
    if (series.length > 0) {
      series.map(async item => {
        const chapters = await chapterService.model.find({ seriesId: item._id, isPremium: false });
        let last = chapters[chapters.length - 1];
        let secondLast = chapters[chapters.length - 2];
        let third = chapters[chapters.length - 3];
        await chapterService.update(last._id, { discordOnly: true })
        await chapterService.update(secondLast._id, { membersOnly: true, discordOnly: false })
        await chapterService.update(third._id, { membersOnly: true,  discordOnly: false})
        chapters.map(async element => {
          if (element._id === last._id) {
            return;
          }
          if (element._id === secondLast._id) {
            return;
          }
          if (element._id === third._id) {
            return;
          }
          await chapterService.update(element._id, {membersOnly: false,  discordOnly: false})
        })
      })
    }
    const res = await axios.get('https://greenztl.com/api/rss')
  } catch (error) {
    throw new Error(error.message);
  }
}
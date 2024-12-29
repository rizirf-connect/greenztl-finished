// series.controller.js
import { chapterService } from "../services/Chapter.Service.js";
import { commentService } from "../services/Comment.Service.js";
import { seriesService } from "../services/Series.Service.js";

// Create a new series
export const createSeries = async (req, res) => {
  try {
    const series = await seriesService.create(req.body);
    res.status(201).json(series);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllSeries = async (req, res) => {
  try {
    const { sort, status, genre, type, order } = req.query;
    const filter = {};

    if (status) {
      filter.status = status.trim(); // Trim whitespace
    }

    if (genre) {
      const genresArray = genre.split(",").map((g) => g.trim());
      filter.genres = { $in: genresArray };
    }

    let sortCriteria = {};

    if (sort === "views") {
      // Default sorting is descending by views
      const sortOrder = order === "asc" ? 1 : -1;
      sortCriteria.views = sortOrder;
    } else if (sort === "recent") {
      sortCriteria.createdAt = -1;
    }

    if (type) {
      filter.type = type.trim();
    }

    const seriesList = await seriesService.model
      .find(filter)
      .sort(sortCriteria);

    res.status(200).json(seriesList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchSeries = async (req, res) => {
  try {
    const { keyword } = req.query;
    const filter = {};

    if (keyword) {
      filter.name = { $regex: keyword, $options: "i" };
    }

    const seriesList = await seriesService.model
      .find(filter)
      .select("_id name thumbnail images")
      .limit(5)
      .sort({ name: 1 });

    res.status(200).json(seriesList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read recently created series
export const getRecentCreatedSeries = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = type ? { type } : {};

    const seriesList = await seriesService.read(filter, null, {
      sort: { createdAt: -1 },
      limit: 3,
    });

    res.status(200).json(seriesList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRandomSeriesByGenre = async (req, res) => {
  try {
    const { genre } = req.query;

    const filter = {};

    if (genre) {
      filter.genres = { $regex: new RegExp(genre, "i") };
    }

    const randomSeriesList = await seriesService.model.aggregate([
      { $match: filter },
      { $sample: { size: 8 } },
    ]);

    res.status(200).json(randomSeriesList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Read a series by ID
export const getSeriesById = async (req, res) => {
  try {
    const series = await seriesService.readById(req.params.id);
    if (!series) {
      return res.status(404).json({ message: "Series not found" });
    }
    res.status(200).json(series);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a series
export const updateSeries = async (req, res) => {
  try {
    const series = await seriesService.update(req.params.id, req.body);
    if (!series) {
      return res.status(404).json({ message: "Series not found" });
    }
    res.status(200).json(series);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a series
export const deleteSeries = async (req, res) => {
  try {
    const series = await seriesService.delete(req.params.id);
    if (!series) {
      return res.status(404).json({ message: "Series not found" });
    }
    res.status(204).send(); // No content to send back
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const viewSeries = async (req, res) => {
  try {
    const seriesId = req.params.id;

    const series = await seriesService.model
      .findByIdAndUpdate(seriesId, { $inc: { views: 1 } }, { new: true })
      .populate("translator", "name");

    if (!series) {
      return res.status(404).json({ message: "Series not found" });
    }

    const firstChapter = await chapterService.model
      .findOne({ seriesId })
      .sort({ createdAt: 1 })
      .select("_id title");

    const lastChapter = await chapterService.model
      .findOne({ seriesId })
      .sort({ createdAt: -1 })
      .select("_id title");

    const isSameChapter =
      firstChapter && lastChapter && firstChapter._id.equals(lastChapter._id);

    const chapters = await chapterService.model.find({ seriesId });
    const chapterIds = chapters.map((chapter) => chapter._id);
    const commentsCount = await commentService.model.countDocuments({
      chapterId: { $in: chapterIds },
    });

    res.status(200).json({
      message: "View count updated",
      series,
      commentsCount,
      firstChapter: firstChapter || null,
      lastChapter: isSameChapter ? null : lastChapter || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMostPopularSeries = async (req, res) => {
  try {
    const popularSeries = await seriesService.model
      .find({})
      .sort({ views: -1, ratings: -1 }) // Sort by views and ratings in descending order
      .limit(3); // Limit to 3 results

    if (!popularSeries || popularSeries.length === 0) {
      return res.status(404).json({ message: "No popular series found." });
    }

    return res.status(200).json(popularSeries);
  } catch (error) {
    console.error("Error fetching popular series:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
export const getMostPopularGenres = async (req, res) => {
  try {
    // Step 1: Find the top 3 most popular genres based on views and ratings
    const genres = await seriesService.model.aggregate([
      {
        $unwind: "$genres", // Unwind genres array to process each genre individually
      },
      {
        $group: {
          _id: "$genres", // Group by genre
          totalViews: { $sum: "$views" }, // Sum views for each genre
          totalRatings: { $avg: "$ratings" }, // Average ratings for each genre
        },
      },
      {
        $sort: {
          totalViews: -1, // Sort by views in descending order
          totalRatings: -1, // Sort by ratings in descending order
        },
      },
      {
        $limit: 3, // Limit to top 3 genres
      },
    ]);

    const popularNovels = [];
    const novelSet = new Set(); // A set to track unique novels by their ID

    // Step 2: For each genre, find one top novel
    for (const genre of genres) {
      const novel = await seriesService.model
        .findOne({ genres: genre._id })
        .sort({ views: -1, ratings: -1 }) // Sort novels by views and ratings
        .select("name _id thumbnail images views ratings") // Select relevant fields
        .limit(1); // Only get one novel

      // If the novel isn't already in the set, add it
      if (novel && !novelSet.has(novel._id.toString())) {
        novelSet.add(novel._id.toString());
        popularNovels.push({
          genre: genre._id,
          novel,
        });
      }
    }

    // Return the result
    return res.status(200).json(popularNovels);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getSeriesAndChapters = async (req, res) => {
  try {
    const { day } = req.query;

    let filter = {};

    if (day) {
      filter.schedule = day.trim();
    }

    const seriesList = await seriesService.model
      .find(filter)
      .sort({ createdAt: -1 });

    const seriesWithChapters = await Promise.all(
      seriesList.map(async (series) => {
        const chapters = await chapterService.model
          .find({ seriesId: series._id })
          .sort({ createdAt: -1 })
          .limit(3);

        return {
          series,
          chapters,
        };
      })
    );

    res.status(200).json(seriesWithChapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

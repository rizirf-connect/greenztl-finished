import { parseRss } from "../helpers/rssParser.js";
import RSS from "rss";
import { seriesService } from "../services/Series.Service.js";

let url = "https://netflixtechblog.com/feed";

export const getRssFeed = async () => {
  try {
    const res = await parseRss(url);
    console.log("RESPONSE_RSS => ", res);
    return "hello";
  } catch (error) {
    console.log(error);
  }
};

export const generateRssFeed = async (req, res) => {
  try {
    const result = await seriesService.model.aggregate([
      {
        $lookup: {
          from: "chapters",
          localField: "_id",
          foreignField: "seriesId",
          as: "chapters",
        },
      },
      {
        $unwind: "$chapters",
      },
      {
        $match: {
          "chapters.discordOnly": false,
          "chapters.membersOnly": false,
        },
      },
      {
        $group: {
          _id: "$_id",
          seriesName: { $first: "$name" },
          category: { $first: "$type" },
          publicationDate: { $first: "$createdAt" },
          description: { $first: "$description" },
        },
      },
      {
        $project: {
          _id: 1,
          seriesName: 1,
          category: 1,
          publicationDate: 1,
          description: 1,
        },
      },
      {
        $sort: {
          publicationDate: -1, // Sort by publication date in descending order
        },
      },
    ]);

    const feed = new RSS({
      title: "GreenZTL - Latest Updates",
      description:
        "Stay updated with the latest news and insights from GreenZTL.",
      feed_url: "https://api.greenztl.com/api/rss",
      site_url: "https://greenztl.com",
      language: "en",
      // Include the stylesheet in the custom namespaces
      custom_namespaces: {
        xsl: "http://www.w3.org/1999/XSL/Transform",
      },
      // Include the stylesheet in the custom elements
      custom_elements: [
        {
          "xml-stylesheet":
            'type="text/xsl" href="https://greenztl.com/rss-stylesheet.xsl"',
        },
      ],
    });

    result.forEach((series) => {
      feed.item({
        title: series.seriesName,
        description: series.description,
        url: `https://greenztl.com/series/${series._id}`,
        date: series.publicationDate,
        category: series.category,
      });
    });

    const rss = feed.xml({ indent: true });
    res.type("application/rss+xml");
    res.send(rss);
  } catch (err) {
    console.error("Error fetching series:", err);
    throw err;
  }
};

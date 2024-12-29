import express from "express";
import {
  createSeries,
  getAllSeries,
  getSeriesById,
  updateSeries,
  deleteSeries,
  getRecentCreatedSeries,
  getRandomSeriesByGenre,
  viewSeries,
  getMostPopularSeries,
  getMostPopularGenres,
  searchSeries,
  getSeriesAndChapters,
} from "../controllers/Series.Controller.js";
import {
  createSeriesSchema,
  updateSeriesSchema,
} from "../schemas/SeriesSchemas.js";
import validateSchema from "../middlewares/validateSchema.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Series
 *   description: Series management and CRUD operations
 */

/**
 * @swagger
 * /api/series:
 *   post:
 *     summary: Create a new series
 *     tags: [Series]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Adventure of the Seas"
 *               description:
 *                 type: string
 *                 example: "A thrilling series about sea adventures."
 *               translator:
 *                 type: string
 *                 description: ID of the translator (User ID)
 *                 example: "60d0fe4f5311236168a109ca"
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Adventure", "Fantasy"]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Epic", "Sea"]
 *               thumbnail:
 *                 type: string
 *                 example: "http://example.com/image.jpg"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["http://example.com/image.jpg","http://example.com/image.jpg"]
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                 example: ["Monday", "Thursday"]
 *               type:
 *                 type: string
 *                 example: "banner"
 *               paymentType:
 *                 type: string
 *                 enum: [single-chapter, tier-based]
 *     responses:
 *       201:
 *         description: Series created successfully
 *       400:
 *         description: Invalid request, missing required fields
 */
router.post("/", validateSchema(createSeriesSchema), createSeries);

/**
 * @swagger
 * /api/series:
 *   get:
 *     summary: Get all series with optional filters and sorting
 *     tags: [Series]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter series by status (e.g., ongoing, completed)
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter series by genre (e.g., Action, Adventure)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [popular, views, recent]
 *         description: Sort series by views, popularity, or creation date
 *     responses:
 *       200:
 *         description: A list of series
 *       500:
 *         description: Internal server error
 */

router.get("/", getAllSeries);
/**
 * @swagger
 * /api/series/search:
 *   get:
 *     summary: Search for series by keyword.
 *     tags:
 *       - Series
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Keyword to search for series by name.
 *     responses:
 *       200:
 *         description: A list of series matching the search criteria.
 *       500:
 *         description: Server error.
 */
router.get("/search", searchSeries);
/**
 * @swagger
 * /api/series/recent:
 *   get:
 *     summary: Get recently created series
 *     tags: [Series]
 *     responses:
 *       200:
 *         description: A list of recently created series
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "60d0fe4f5311236168a109cb"
 *                   name:
 *                     type: string
 *                     example: "Adventure of the Seas"
 *                   description:
 *                     type: string
 *                     example: "A thrilling series about sea adventures."
 *                   genres:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Adventure", "Fantasy"]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */
router.get("/recent", getRecentCreatedSeries);
/**
 * @swagger
 * /api/series/random:
 *   get:
 *     summary: Get a random series by genre
 *     tags: [Series]
 *     parameters:
 *       - in: query
 *         name: genre
 *         required: true
 *         description: The genre of the series to filter by
 *         schema:
 *           type: string
 *           example: "Adventure"
 *     responses:
 *       200:
 *         description: A random series from the specified genre
 *       400:
 *         description: Invalid genre specified
 *       500:
 *         description: Internal server error
 */
router.get("/random", getRandomSeriesByGenre);

/**
 * @swagger
 * /api/series/popular:
 *   get:
 *     summary: Get the most popular series
 *     tags: [Series]
 *     description: Returns the three most popular series based on views and ratings.
 *     responses:
 *       200:
 *         description: A list of the most popular series
 *       500:
 *         description: Internal server error
 */
router.get("/popular", getMostPopularSeries);

/**
 * @swagger
 * /api/series/popular-genres:
 *   get:
 *     summary: Retrieve Most Popular Genres
 *     description: Get the top three genres based on views and ratings, along with the top three novels in each genre.
 *     operationId: getMostPopularGenres
 *     tags:
 *       - Series
 *     responses:
 *       '200':
 *         description: Successful response with the most popular genres and their corresponding novels.
 *       '500':
 *         description: Server error
 */

router.get("/popular-genres", getMostPopularGenres);

/**
 * @swagger
 * /api/series/chapters:
 *   get:
 *     summary: Get up to 8 series and 3 recent chapters for each series, optionally filtered by day
 *     tags: [Series]
 *     parameters:
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *         description: Filter series by day (e.g., Monday, Tuesday)
 *     responses:
 *       200:
 *         description: A list of series with their most recent chapters
 *       500:
 *         description: Internal server error
 */
router.get("/chapters", getSeriesAndChapters);

/**
 * @swagger
 * /api/series/{id}:
 *   get:
 *     summary: Get series by ID
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The series ID
 *     responses:
 *       200:
 *         description: The series details
 *       404:
 *         description: Series not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getSeriesById);

/**
 * @swagger
 * /api/series/{id}:
 *   put:
 *     summary: Update a series
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The series ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Adventure of the Seas"
 *               description:
 *                 type: string
 *                 example: "A thrilling series about sea adventures."
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Adventure", "Fantasy"]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Epic", "Sea"]
 *               thumbnail:
 *                 type: string
 *                 example: "http://example.com/image.jpg"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["http://example.com/image.jpg","http://example.com/image.jpg"]
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Monday", "Thursday"]
 *               type:
 *                 type: string
 *                 example: "banner"
 *     responses:
 *       200:
 *         description: Series updated successfully
 *       404:
 *         description: Series not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", validateSchema(updateSeriesSchema), updateSeries);

/**
 * @swagger
 * /api/series/{id}:
 *   delete:
 *     summary: Delete a series
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The series ID
 *     responses:
 *       200:
 *         description: Series deleted successfully
 *       404:
 *         description: Series not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteSeries);
/**
 * @swagger
 * /api/series/{id}/view:
 *   put:
 *     summary: Increment the view count for a series
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the series to increment the view count for
 *     responses:
 *       200:
 *         description: View count incremented successfully
 *       404:
 *         description: Series not found
 *       500:
 *         description: Internal server error
 */

router.put("/:id/view", viewSeries);

export default router;

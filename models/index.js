import { Schema, model } from "mongoose";

// User Schema
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, required: true, default: false },
    isAdmin: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    discordJoined: {type: Boolean, default: false},
    purchasedChapters: [
      {
        type: Schema.Types.ObjectId,
        ref: "Chapter",
      },
    ],

    purchasedTiers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tier",
      },
    ],
  },
  { timestamps: true }
);

// Chapter Schema
const ChapterSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
    isPremium: { type: Boolean, default: false },
    price: { type: Number, min: 0 },
    discordOnly:{type: Boolean, default:false},
    membersOnly:{type: Boolean, default:false}
  },
  { timestamps: true }
);
ChapterSchema.index({ title: 1, seriesId: 1 }, { unique: true });
ChapterSchema.pre("save", async function (next) {
  const Series = model("Series");

  const seriesExists = await Series.exists({ _id: this.seriesId });

  if (!seriesExists) {
    const error = new Error("Series ID does not exist.");
    return next(error);
  }

  next();
});
const Chapter = model("Chapter", ChapterSchema);

// Comments Schema
const commentsSchema = new Schema(
  {
    content: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    replies: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
  },
  { timestamps: true }
);
commentsSchema.pre("save", async function (next) {
  try {
    const User = model("User");
    const Chapter = model("Chapter");

    // Check if userId exists
    const userExists = await User.exists({ _id: this.userId });
    if (!userExists) {
      return next(new Error("User ID does not exist"));
    }

    // Check if chapterId exists
    const chapterExists = await Chapter.exists({ _id: this.chapterId });
    if (!chapterExists) {
      return next(new Error("Chapter ID does not exist"));
    }

    // If both exist, continue with the save
    next();
  } catch (error) {
    next(error);
  }
});

const Comment = model("Comment", commentsSchema);

// Series Schema
const seriesSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    translator: { type: Schema.Types.ObjectId, ref: "User" },
    genres: [{ type: String }],
    tags: [{ type: String }],
    thumbnail: { type: String },
    images: [{ type: String }],
    views: { type: Number, default: 0 },
    ratings: { type: Number, default: 0 },
    schedule: [{ type: String }],
    type: { type: String },
    status: {
      type: String,
      default: "ongoing",
      enum: ["ongoing", "completed"],
    },

    paymentType: {
      type: String,
      required: true,
      enum: ["single-chapter", "tier-based"],
      default: "single-chapter",
    },

    tiers: [{ type: Schema.Types.ObjectId, ref: "Tier" }],
  },
  { timestamps: true }
);

const Series = model("Series", seriesSchema);

const User = model("User", userSchema);

// User Schema
const notificationsSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const Notification = model("Notification", notificationsSchema);

const tierSchema = new Schema(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
    name: { type: String, required: true },
    chapters: [{ type: Schema.Types.ObjectId, ref: "Chapter", required: true }],
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

const Tier = model("Tier", tierSchema);

// Monitor Schema
const monitorSchema = new Schema({
  folders: {
    type: Map,
    of: new Schema({
      seriesId: { type: Schema.Types.ObjectId, required: true },
      isPremium: { type: Boolean, required: true },
      price: { type: Number, required: true },
    }),
  },
  processedFiles: {
    type: Map,
    of: new Schema({
      processedAt: { type: Date, required: true },
      seriesId: { type: Schema.Types.ObjectId, required: true },
      chapterId: { type: Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      type: { type: String, required: true },
    }),
  },
});

const Monitor = model("Monitor", monitorSchema);

export { Chapter, Comment, Series, User, Notification, Tier, Monitor };

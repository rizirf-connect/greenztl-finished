import cloudinary from "../helpers/cloudinary.js";

export const uploadImage = (req, res) => {
  cloudinary.uploader.upload(req.file.path, (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .json({ success: false, message: "Error uploading image" });
    }

    res.status(200).json({
      success: true,
      message: "Uploaded successfully!",
      data: result.secure_url,
    });
  });
};

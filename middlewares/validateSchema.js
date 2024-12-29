const validateSchema = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    // Log the entire error for debugging
    console.error("Validation Error:", error);

    // Check if error.errors exists
    if (error.errors) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors.map((err) => ({
          field: err.path.join("."), // Full path to the field that failed validation
          message: err.message, // Specific error message
        })),
      });
    } else {
      // If there are no specific errors, send a generic error response
      return res.status(400).json({
        message: "Validation failed",
        details: "An unknown validation error occurred.",
      });
    }
  }
};

export default validateSchema;

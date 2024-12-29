// requestLogger.js
const requestLogger = (req, res, next) => {
  const { method, url } = req;
  const start = Date.now();

  res.on("finish", () => {
    // Event listener for when the response is finished
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const timestamp = new Date().toLocaleString();

    console.log(
      `[${timestamp}] ${method} request to ${url} responded with status ${statusCode} and took ${duration}ms`
    );
  });

  next();
};

export default requestLogger;

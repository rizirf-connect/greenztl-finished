import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Greenz Translations",
    version: "1.0.0",
    description: "Greenz Translations API documentation :)",
    contact: {
      name: "Danish Javed",
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === "production"
        ? "https://api.greenztl.com"
        : "http://localhost:5000",
      description: process.env.NODE_ENV === "production" ? "Production server" : "Development server"
    }
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.routes.js"],
};

const swaggerSpec = swaggerJSDoc(options);
export { swaggerSpec };
// swagger.js
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Savings Helper API",
      version: "1.0.0",
    },
    servers: [
      { url: "http://localhost:5000" }
    ],
    components: {
    securitySchemes: {
        bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        },
    },
},
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);

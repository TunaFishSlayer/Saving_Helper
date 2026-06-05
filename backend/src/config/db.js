import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// In production, you only want to instantiate Prisma Client once.
// Node.js Module caching ensures this is a singleton.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

// Function to connect and test the connection (run on app startup)
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("SQLite connected successfully (via Prisma)");
  } catch (err) {
    console.error("SQLite connection error:", err.message);
    process.exit(1);
  }
};

export { prisma };
export default connectDB;


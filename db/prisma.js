
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connection established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error.message);
    process.exit(1); // Exit if database connection fails
  }
};

export { prisma, connectDB };

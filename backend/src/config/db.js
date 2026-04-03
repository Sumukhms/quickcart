import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Connection pool — tune based on your Atlas tier
      maxPoolSize:     10,
      minPoolSize:     2,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS:          45_000,
      connectTimeoutMS:         10_000,
    });

    console.log("✅ MongoDB connected:", mongoose.connection.host);

    mongoose.connection.on("disconnected", () =>
      console.warn("⚠️  MongoDB disconnected — attempting reconnect…")
    );
    mongoose.connection.on("reconnected", () =>
      console.log("✅ MongoDB reconnected")
    );
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
["SIGINT", "SIGTERM"].forEach((sig) =>
  process.on(sig, async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed (shutdown)");
    process.exit(0);
  })
);

export default connectDB;
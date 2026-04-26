require("dotenv").config();
const mongoose = require("mongoose");
const Hotel = require("../models/Hotel"); // assuming models/Hotel.js

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    
    // Find the hotel matching the description
    const result = await Hotel.deleteMany({
      name: { $regex: /premium hyderabad lodge/i }
    });
    
    console.log("Deleted", result.deletedCount, "hotels.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

run();

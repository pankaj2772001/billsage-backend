const mongoose = require("mongoose");
require("dotenv").config();

const mongooseUri = process.env.MONGODB;

function initializeDatabase() {
  try {
    mongoose
      .connect(mongooseUri)
      .then(() => {
        console.log("DB connected");
      })
      .catch((error) => {
        console.log("Failed to connect db", error);
      });
  } catch (error) {
    console.log("Failed to connect db", error);
  }
}

module.exports = { initializeDatabase };

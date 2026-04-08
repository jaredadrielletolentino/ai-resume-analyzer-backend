import dotenv from "dotenv";
dotenv.config();
import connectDB from "../config/database.js";
import User from "../models/User.js";

async function checkUsers() {
  try {
    await connectDB();
    
    // Find all users
    const users = await User.find({}).select("+password");
    
    console.log("=".repeat(60));
    console.log(`📊 Total users in database: ${users.length}`);
    console.log("=".repeat(60));
    
    if (users.length === 0) {
      console.log("❌ No users found! Please run createAdmin.js first.");
    } else {
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`  ID: ${user._id}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Active: ${user.isActive}`);
        console.log(`  Password Hash: ${user.password ? user.password.substring(0, 30) + "..." : "No password"}`);
      });
    }
    
    console.log("\n" + "=".repeat(60));
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkUsers();
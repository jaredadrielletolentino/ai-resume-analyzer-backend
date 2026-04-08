import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import connectDB from "../config/database.js";
import User from "../models/User.js";

async function createAdminUser() {
  try {
    await connectDB();
    
    const adminEmail = "admin@mail.com";
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log("=".repeat(60));
      console.log("⚠️ Admin user already exists!");
      console.log("=".repeat(60));
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🎭 Role: ${existingAdmin.role}`);
      console.log("=".repeat(60));
      process.exit(0);
    }
    
    // Manually hash the password
    console.log("🔐 Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Admin123!", salt);
    console.log("✅ Password hashed successfully");
    
    // Create admin user with pre-hashed password
    const admin = new User({
      name: "System Administrator",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });
    
    console.log("💾 Saving admin user to database...");
    await admin.save();
    console.log("✅ Admin user saved successfully!");
    
    console.log("=".repeat(60));
    console.log("✅ ADMIN USER CREATED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("📧 Email: admin@mail.com");
    console.log("🔑 Password: Admin123!");
    console.log("🎭 Role: admin");
    console.log("=".repeat(60));
    console.log("\n⚠️  Use these credentials to login:");
    console.log("   Email: admin@mail.com");
    console.log("   Password: Admin123!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

createAdminUser();
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const [email, password, name = "Platform Admin"] = process.argv.slice(2);

if (!email || !password) {
  console.log("Usage: node scripts/createAdmin.js <email> <password> [name]");
  process.exit(1);
}
if (password.length < 8) {
  console.log("Use a password of at least 8 characters");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const exists = await User.findOne({ email: email.toLowerCase() });
if (exists) {
  console.log("A user with this email already exists");
} else {
  await User.create({
    name,
    email,
    password, // hashed automatically by the model
    role: "admin",
    approvalStatus: "approved",
  });
  console.log(`Admin created: ${email}`);
}

await mongoose.disconnect();
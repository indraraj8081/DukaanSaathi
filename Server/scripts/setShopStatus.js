import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const [email, status] = process.argv.slice(2);
const allowed = ["pending", "approved", "rejected", "blocked"];
if (!email || !allowed.includes(status)) {
  console.log(`Usage: node scripts/setShopStatus.js <email> <${allowed.join("|")}>`);
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const result = await User.updateOne(
  { email: email.toLowerCase(), role: "shopkeeper" },
  { $set: { approvalStatus: status } }
);
console.log(result.matchedCount ? `Updated ${email} to ${status}` : "No shopkeeper found with this email");
await mongoose.disconnect();
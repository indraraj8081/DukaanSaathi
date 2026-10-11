import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

// Old "owner" and "staff" accounts become approved shopkeepers
const roles = await User.updateMany(
  { role: { $in: ["owner", "staff"] } },
  { $set: { role: "shopkeeper", approvalStatus: "approved" } }
);

// Any account that has no approval status yet
const approval = await User.updateMany(
  { approvalStatus: { $exists: false } },
  { $set: { approvalStatus: "approved" } }
);

console.log(`Roles updated: ${roles.modifiedCount}, approval set: ${approval.modifiedCount}`);
await mongoose.disconnect();
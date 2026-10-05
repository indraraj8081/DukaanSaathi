import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "bill_<userId>"
  seq: { type: Number, default: 0 },
});

export default mongoose.model("Counter", counterSchema);
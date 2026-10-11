import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    // Shop name is needed only for shopkeepers
    shopName: {
      type: String,
      trim: true,
      required: function () { return this.role === "shopkeeper"; },
    },
    // Phone is needed for everyone except admin
    phone: {
      type: String,
      trim: true,
      required: function () { return this.role !== "admin"; },
    },

    role: { type: String, enum: ["customer", "shopkeeper", "admin"], default: "customer" },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked"],
      default: "approved",
    },

    // Profile
    avatar: { type: String },
    businessType: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },

    // Online store settings
    acceptingOrders: { type: Boolean, default: true },
    minOrder: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
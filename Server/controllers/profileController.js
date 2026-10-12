import sharp from "sharp";
import User from "../models/User.js";

const BUSINESS_TYPES = [
  "Kirana / Grocery", "Medical / Pharmacy", "Stationery", "Bakery", "Dairy",
  "Vegetables & Fruits", "General Store", "Electronics", "Clothing", "Other",
];
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const clean = (v, max = 200) => String(v ?? "").trim().slice(0, max);

// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/profile  (email and role cannot be changed here)
export const updateProfile = async (req, res) => {
  try {
    const name = clean(req.body.name, 80);
    const phone = clean(req.body.phone, 10);
    const shopName = clean(req.body.shopName, 100);
    const businessType = clean(req.body.businessType, 50);
    const address = clean(req.body.address, 300);
    const city = clean(req.body.city, 60);
    const pincode = clean(req.body.pincode, 6);
    const gstin = clean(req.body.gstin, 15).toUpperCase();
    const minOrder = Number(req.body.minOrder) || 0;

    const deliveryCharge = Number(req.body.deliveryCharge) || 0;
    const freeDeliveryAbove = Number(req.body.freeDeliveryAbove) || 0;
    const deliveryPincodes = [
      ...new Set(String(req.body.deliveryPincodes || "").split(/[\s,]+/).filter(Boolean)),
    ];

    if (!name) return res.status(400).json({ message: "Full name is required" });
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
    }
    if (!shopName) return res.status(400).json({ message: "Shop name is required" });
    if (businessType && !BUSINESS_TYPES.includes(businessType)) {
      return res.status(400).json({ message: "Invalid business type" });
    }
    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ message: "Pincode must be 6 digits" });
    }
    if (gstin && !GSTIN_REGEX.test(gstin)) {
      return res.status(400).json({ message: "Enter a valid 15-character GSTIN" });
    }
    if (minOrder < 0 || minOrder > 100000) {
      return res.status(400).json({ message: "Minimum order amount is not valid" });
    }

    if (deliveryCharge < 0 || deliveryCharge > 1000) {
      return res.status(400).json({ message: "Delivery charge must be between 0 and 1000" });
    }
    if (freeDeliveryAbove < 0 || freeDeliveryAbove > 100000) {
      return res.status(400).json({ message: "Free delivery amount is not valid" });
    }
    if (deliveryPincodes.length > 30 || deliveryPincodes.some((p) => !/^\d{6}$/.test(p))) {
      return res.status(400).json({ message: "Delivery pincodes must be 6 digits each (max 30)" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name, phone, shopName, businessType, address, city, pincode, gstin,
          minOrder,
          deliveryCharge,
          freeDeliveryAbove,
          deliveryPincodes,
          acceptingOrders: Boolean(req.body.acceptingOrders),
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/profile/avatar  (multipart, field name "avatar")
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please choose an image" });

    // Shrink to 256x256 webp so it stays around 10-15 KB
    let buffer;
    try {
      buffer = await sharp(req.file.buffer)
        .rotate()
        .resize(256, 256, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      return res.status(400).json({ message: "This file is not a valid image" });
    }

    const avatar = `data:image/webp;base64,${buffer.toString("base64")}`;
    await User.updateOne({ _id: req.user._id }, { $set: { avatar } });
    res.json({ avatar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/profile/avatar
export const removeAvatar = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $unset: { avatar: "" } });
    res.json({ message: "Photo removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
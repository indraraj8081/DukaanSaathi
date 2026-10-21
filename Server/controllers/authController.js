import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js";

// One place that decides what the frontend receives about a user
const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  shopName: user.shopName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  approvalStatus: user.approvalStatus,
  token: generateToken(user._id),
});

// POST /api/auth/register  (shopkeepers only; customers get their own route in Step B)
export const registerUser = async (req, res) => {
  const BUSINESS_TYPES = [
  "Kirana / Grocery", "Medical / Pharmacy", "Stationery", "Bakery", "Dairy",
  "Vegetables & Fruits", "General Store", "Electronics", "Clothing", "Other",
  ];
  try {
    const name = String(req.body.name || "").trim();
    const shopName = String(req.body.shopName || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "");

    const address = String(req.body.address || "").trim().slice(0, 300);
    const businessType = String(req.body.businessType || "").trim();
    if (!BUSINESS_TYPES.includes(businessType)) {
      return res.status(400).json({ message: "Please choose a shop category" });
    }
    if (address.length < 10) {
      return res.status(400).json({ message: "Please enter your full shop address" });
    }

    if (!name || !shopName || !email || !phone || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "This email is already registered" });
    }

    // Role and approval are decided by the server, never by the request body
    const user = await User.create({
      name,
      shopName,
      email,
      phone,
      password,
      role: "shopkeeper",
      approvalStatus: "pending",
    });

    res.status(201).json(userPayload(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Checked after the password, so strangers cannot find out which emails are blocked
    if (user.approvalStatus === "blocked") {
      return res.status(403).json({
        message: "Your account is blocked. Please contact support.",
        code: "ACCOUNT_BLOCKED",
      });
    }
    const expected = req.body.expectedRole;
    if (expected && user.role !== expected) {
      return res.status(403).json({
        message: `This is not a ${expected} account. Please use the correct login page.`,
      });
    }

    res.json(userPayload(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// POST /api/auth/register-customer
export const registerCustomer = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "");

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "This email is already registered" });
    }

    // Role is fixed by the server, customers need no approval
    const user = await User.create({
      name, email, phone, password, address,businessType, role: "customer", approvalStatus: "approved",
    });
    res.status(201).json(userPayload(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me (protected)
export const getMe = async (req, res) => {
  res.json(req.user);
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// POST /api/auth/forgot-password  { email }
export const forgotPassword = async (req, res) => {
  // Same answer every time, so nobody can find out which emails exist
  const reply = () =>
    res.json({ message: "If this email is registered, a reset link has been sent. It is valid for 30 minutes." });

  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Please enter your email" });

    const user = await User.findOne({ email });
    if (!user || user.approvalStatus === "blocked") return reply();

    const token = crypto.randomBytes(32).toString("hex");

    // updateOne avoids re-validating old accounts that miss newer fields
    await User.updateOne(
      { _id: user._id },
      { $set: { resetTokenHash: hashToken(token), resetTokenExpires: new Date(Date.now() + 30 * 60 * 1000) } }
    );

    const base = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
    const link = `${base}/reset-password/${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Dukan Saathi password",
        text: `Hello ${user.name},\n\nUse this link to set a new password (valid for 30 minutes):\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
        html: `<p>Hello ${escapeHtml(user.name)},</p><p>Use this link to set a new password (valid for 30 minutes):</p><p><a href="${link}">${link}</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
      });
    } catch (mailError) {
      // The person still gets the generic reply; the real reason stays in the server log
      console.error("Reset email failed:", mailError.message);
    }

    return reply();
  } catch (error) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

// POST /api/auth/reset-password/:token  { password }
export const resetPassword = async (req, res) => {
  try {
    const password = String(req.body.password || "");
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetTokenHash: hashToken(String(req.params.token)),
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: await bcrypt.hash(password, 10) },
        $unset: { resetTokenHash: "", resetTokenExpires: "" },
      }
    );

    res.json({ message: "Password changed. You can log in now." });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};
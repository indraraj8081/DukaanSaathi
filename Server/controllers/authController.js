import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

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
  try {
    const name = String(req.body.name || "").trim();
    const shopName = String(req.body.shopName || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "");

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
      name, email, phone, password, role: "customer", approvalStatus: "approved",
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
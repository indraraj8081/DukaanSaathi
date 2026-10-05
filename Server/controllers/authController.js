import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, shopName, email, password } = req.body;

    if (!name || !shopName || !email || !password) {
      return res.status(400).json({ message: "Sabhi fields bharo" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Ye email pehle se registered hai" });
    }

    const user = await User.create({ name, shopName, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      shopName: user.shopName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        shopName: user.shopName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Email ya password galat hai" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me (protected)
export const getMe = async (req, res) => {
  res.json(req.user);
};
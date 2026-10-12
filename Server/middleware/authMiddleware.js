import jwt from "jsonwebtoken";
import User from "../models/User.js";


// Checks that the request has a valid token and the account is allowed to use the app
export const protect = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the user fresh from the database on every request
    const user = await User.findById(decoded.id).select("-password -avatar");
    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.approvalStatus === "blocked") {
      return res.status(403).json({
        message: "Your account is blocked. Please contact support.",
        code: "ACCOUNT_BLOCKED",
      });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Token is invalid or has expired" });
  }
};

// Allows only the listed roles, e.g. authorize("shopkeeper")
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to do this" });
  }
  next();
};
// Like protect, but never blocks: a guest simply has no req.user
export const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization?.startsWith("Bearer ")) {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password -avatar");
      if (user && user.approvalStatus !== "blocked") req.user = user;
    }
  } catch {
    // bad or expired token: treat the person as a guest
  }
  next();
};
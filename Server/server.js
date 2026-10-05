import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import billRoutes from "./routes/billRoutes.js";

dotenv.config();      // .env ko load karta hai
connectDB();          // database se jodta hai

const app = express();

app.use(cors());              // frontend ko allow karta hai
app.use(express.json());      // request body ko JSON mein padhta hai

app.get("/", (req, res) => {
  res.json({ message: "DukaanSaathi API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bills", billRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
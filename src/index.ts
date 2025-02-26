import express from "express";
import connectDB from "./config/db";
import dotenv from "dotenv";
import cors from "cors";
import slotRoutes from "./routes/slotRoutes";

dotenv.config();

connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, Book your slots!");
});

app.use("/slot", slotRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import cors from "cors";
import express from "express";
import morgan from "morgan";
import { verifyToken } from "./middlewares/auth.middleware.js";
import { authRoutes, productRoutes, userRoutes } from "./routes/route.index.js";
import { connectToRabbitMQ } from "./utils/rabbitmq.js";
import dotenv from "dotenv";

const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Home page");
});

app.use("/api/v1/products", verifyToken, productRoutes);
app.use("/api/v1/users", userRoutes);

const start = async () => {
  await connectToRabbitMQ();
  console.log("🐰 RabbitMQ connected");

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

start();

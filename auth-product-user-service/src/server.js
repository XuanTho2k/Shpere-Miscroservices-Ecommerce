import cors from "cors";
import express from "express";
import morgan from "morgan";
import { verifyToken } from "./middlewares/auth.middleware.js";
import { authRoutes, productRoutes, userRoutes } from "./routes/route.index.js";
import { connectToRabbitMQ } from "./utils/rabbitmq.js";
const app = express();

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
  app.listen(3000, () =>
    console.log("🛒 Product Service running on port 3000")
  );
};

start();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

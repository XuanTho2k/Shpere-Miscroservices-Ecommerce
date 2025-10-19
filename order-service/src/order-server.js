import express from "express";
import dotenv from "dotenv";
import { connectToRabbitMQ, consumeMessage } from "./utils/rabbitmq.js";
import prisma from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { log } from "console";
import { createOrder } from "./controllers/order.controller.js";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());

app.get("/", (req, res) => res.json({ service: "Order Service 🧾" }));

app.post("/orders", async (req, res) => {
  const { productId, quantity } = req.body;
  const order = await prisma.order.create({
    data: { productId, quantity, status: "pending" },
  });

  res.json({ message: "Order created", order });
});

io.on("connection", (socket) => {
  console.log("🔗 Client connected");
});

await connectToRabbitMQ();

consumeMessage("product_updates", async (msg) => {
  console.log("📩 [Order] Received:", msg);
  if (msg.event === "PRODUCT_UPDATED") {
    await prisma.order.upsert({
      where: { id: msg.data.id },
      update: { status: "cancelled", price: msg.data.price },
      create: {
        productId: msg.data.id,
        quantity: 1,
        status: "pending",
        price: msg.data.price,
      },
    });

    console.log("🔔 [Order] Emitting product updated event");
    io.emit("product_updated", msg.data);
  }
});

consumeMessage("order_created", async (msg) => {
  console.log("📩 [Order] Received:", msg);
  await createOrder(msg.data);
  io.emit("order_created", msg.data);
});

console.log(
  "🐰 RabbitMQ connected - order service is ready to receive messages"
);
httpServer.listen(4001, () =>
  console.log("🧾 Order Service + Socket.IO on port 4001")
);

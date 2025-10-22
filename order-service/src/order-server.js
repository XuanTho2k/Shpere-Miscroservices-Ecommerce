import express from "express";
import dotenv from "dotenv";
import { connectToRabbitMQ, subscribeToExchange } from "./utils/rabbitmq.js";
import prisma from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  createOrder,
  upsertOrder,
  getOrders,
  updateOrderStatus,
} from "./controllers/order.controller.js";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());

// Routes
app.get("/", (req, res) =>
  res.json({
    service: "Order Service 🧾",
    status: "running",
    endpoints: ["/orders", "/orders/:id/status"],
  })
);

app.post("/orders", createOrder);
app.get("/orders", getOrders);
app.put("/orders", upsertOrder);
app.put("/orders/:id/status", updateOrderStatus);

// Socket.IO connection handling
const connectedClients = new Map();

io.on("connection", (socket) => {
  console.log("🔗 Client connected:", socket.id);
  connectedClients.set(socket.id, socket);

  socket.emit("system", {
    msg: "Connected to Order Service",
    timestamp: new Date().toISOString(),
  });

  socket.on("disconnect", () => {
    console.log("🔗 Client disconnected:", socket.id);
    connectedClients.delete(socket.id);
  });
});

// Broadcast function
function broadcastToClients(event, data) {
  connectedClients.forEach((socket) => {
    socket.emit(event, data);
  });
}

const start = async () => {
  try {
    await connectToRabbitMQ();

    // Subscribe to product events
    await subscribeToExchange(
      "product_events",
      "order_product_updates",
      async (msg) => {
        console.log("📦 [Order] Product event received:", msg);

        if (
          msg.event === "PRODUCT_UPDATED" ||
          msg.event === "PRODUCT_PRICE_UPDATED"
        ) {
          // Update existing orders with new product price
          await prisma.order.updateMany({
            where: { productId: msg.data.id },
            data: {
              price: msg.data.price,
              status: "price_updated",
            },
          });

          console.log("🔔 [Order] Updated orders with new product price");
          broadcastToClients("product_updated", {
            ...msg.data,
            timestamp: new Date().toISOString(),
            type: "product_update",
          });
        }

        if (msg.event === "PRODUCT_DELETED") {
          // Cancel orders for deleted product
          await prisma.order.updateMany({
            where: { productId: msg.data.id },
            data: { status: "cancelled" },
          });

          console.log("🔔 [Order] Cancelled orders for deleted product");
          broadcastToClients("product_deleted", {
            ...msg.data,
            timestamp: new Date().toISOString(),
            type: "product_deleted",
          });
        }
      }
    );

    // Subscribe to order events (for internal processing)
    await subscribeToExchange(
      "order_events",
      "order_internal_events",
      async (msg) => {
        console.log("🛒 [Order] Order event received:", msg);

        // Broadcast to frontend clients
        broadcastToClients("order_event", {
          ...msg,
          timestamp: new Date().toISOString(),
        });
      }
    );

    console.log(
      "🐰 RabbitMQ connected - Order service is ready to receive messages"
    );

    const port = process.env.PORT || 4001;
    httpServer.listen(port, () => {
      console.log(`🧾 Order Service + Socket.IO running on port ${port}`);
      console.log(`🔗 WebSocket available at ws://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start Order Service:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down Order Service...");
  process.exit(0);
});

start();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectRabbitMQ, subscribe, publish } from "./rabbitmq.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) =>
  res.json({
    service: "📢 Notification Service",
    status: "running",
    exchanges: ["product_events", "order_events", "system_events"],
  })
);

// API endpoint để test pub/sub
app.post("/test-publish", async (req, res) => {
  try {
    const { exchange, message } = req.body;
    await publish(exchange, message);
    res.json({ success: true, message: "Published successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Lưu trữ connected clients
const connectedClients = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Frontend connected:", socket.id);
  connectedClients.set(socket.id, socket);

  socket.emit("system", {
    msg: "Connected to Notification Service",
    timestamp: new Date().toISOString(),
  });

  socket.on("disconnect", () => {
    console.log("🔌 Frontend disconnected:", socket.id);
    connectedClients.delete(socket.id);
  });
});

// Broadcast function để gửi message tới tất cả clients
function broadcastToClients(event, data) {
  connectedClients.forEach((socket) => {
    socket.emit(event, data);
  });
}

async function start() {
  try {
    await connectRabbitMQ();

    // Subscribe các events khác nhau
    const subscriptions = [
      {
        queue: "product_updates",
        handler: (data) => {
          console.log(`📦 [Product Update]`, data);
          broadcastToClients("product_update", {
            ...data,
            timestamp: new Date().toISOString(),
            type: "product_update",
          });
        },
      },
      {
        queue: "order_created",
        handler: (data) => {
          console.log(`🛒 [Order Created]`, data);
          broadcastToClients("order_created", {
            ...data,
            timestamp: new Date().toISOString(),
            type: "order_created",
          });
        },
      },
      {
        queue: "system_logs",
        handler: (data) => {
          console.log(`📋 [System Log]`, data);
          broadcastToClients("log_event", {
            ...data,
            timestamp: new Date().toISOString(),
            type: "system_log",
          });
        },
      },
    ];

    // Setup subscriptions
    for (const sub of subscriptions) {
      await subscribe(sub.queue, sub.handler);
    }

    const port = process.env.PORT || 5000;
    httpServer.listen(port, () => {
      console.log(`📢 Notification Service running on port ${port}`);
      console.log(`🔗 WebSocket available at ws://localhost:${port}`);
      console.log(
        `📡 Subscribed to: ${subscriptions.map((s) => s.queue).join(", ")}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start Notification Service:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down Notification Service...");
  process.exit(0);
});

start();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectRabbitMQ, subscribe } from "./rabbitmq.js";

dotenv.config();

const app = express();
app.use(cors());
app.get("/", (req, res) =>
  res.json({ msg: "📢 Notification Service running" })
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("🔌 Frontend connected:", socket.id);
  socket.emit("system", { msg: "Connected to Notification Service" });
});

async function start() {
  await connectRabbitMQ();

  // Subcribe các queue khác nhau
  const queues = ["product_updates", "order_created", "system_logs"];
  for (const q of queues) {
    await subscribe(q, (data) => {
      console.log(`📥 [${q}]`, data);

      // Emit tới frontend
      io.emit("log_event", {
        queue: q,
        data,
        time: new Date().toLocaleTimeString(),
      });
    });
  }

  httpServer.listen(process.env.PORT, () =>
    console.log(`📢 Notification Service on port ${process.env.PORT}`)
  );
}

start();

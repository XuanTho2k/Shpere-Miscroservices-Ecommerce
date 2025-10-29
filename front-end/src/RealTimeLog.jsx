import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Kết nối tới notification service (port 5000)
const socket = io("http://localhost:5000");

export default function RealtimeLog() {
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () =>
      addLog("✅ Connected to Notification Service", "success")
    );
    socket.on("disconnect", () =>
      addLog("❌ Disconnected from Notification Service", "error")
    );

    socket.on("system", (data) => {
      addLog(`🔧 ${data.msg}`, "info");
    });

    // Product events
    socket.on("product_update", (data) => {
      addLog(
        `📦 Product updated: ${data.name || data.data?.name} — Price: $${
          data.price || data.data?.price
        }`,
        "info"
      );
    });

    socket.on("old_logs", (data) => {
      setLogs(data); // load lại log cũ từ Redis
    });

    socket.on("product_created", (data) => {
      addLog(
        `✨ New product created: ${data.name || data.data?.name} — Price: $${
          data.price || data.data?.price
        }`,
        "success"
      );
    });

    socket.on("product_deleted", (data) => {
      addLog(`🗑️ Product deleted: ${data.name || data.data?.name}`, "warning");
    });

    // Order events
    socket.on("order_created", (data) => {
      addLog(
        `🛒 New order created: ID ${data.id || data.data?.id} — Product: ${
          data.productId || data.data?.productId
        }`,
        "success"
      );
    });

    socket.on("order_updated", (data) => {
      addLog(
        `📝 Order updated: ID ${data.id || data.data?.id} — Status: ${
          data.status || data.data?.status
        }`,
        "info"
      );
    });

    socket.on("order_event", (data) => {
      const eventType = data.event || "UNKNOWN";
      const orderData = data.data || data;
      addLog(
        `🛒 [${eventType}] Order ID: ${orderData.id} — Status: ${orderData.status}`,
        "info"
      );
    });

    // System logs
    socket.on("log_event", (payload) => {
      const { queue, data, time, type } = payload;

      console.log(
        "🚀 ~ RealTimeLog.jsx:78 ~ RealtimeLog ~ queue:",
        queue,
        time
      );

      const eventType = type || "SYSTEM";
      addLog(`[${eventType.toUpperCase()}] ${JSON.stringify(data)}`, "info");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("system");
      socket.off("product_update");
      socket.off("product_created");
      socket.off("product_deleted");
      socket.off("order_created");
      socket.off("order_updated");
      socket.off("order_event");
      socket.off("log_event");
      socket.off("old_logs");
    };
  }, []);

  const addLog = (msg, type = "info") => {
    setLogs((prev) => [
      ...prev,
      { msg, type, time: new Date().toLocaleTimeString() },
    ]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const typeColors = {
    info: "text-blue-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-gray-900 text-gray-100 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold">⚡ Realtime Logs</h2>
        <span className="text-sm text-gray-400">{logs.length} entries</span>
      </div>

      <div className="p-4 h-96 overflow-y-auto font-mono text-sm">
        {logs.map((log, i) => {
          console.log("🚀 ~ RealTimeLog.jsx:134 ~ logs.map ~ log:", log.event);
          return (
            <div key={i} className="mb-1">
              <span className="text-gray-500">[{log.time}]</span>{" "}
              <span className={typeColors[log.type] || "text-gray-300"}>
                {JSON.stringify(log) || log.msg}
              </span>
            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

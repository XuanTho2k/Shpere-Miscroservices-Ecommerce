import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // backend của OrderService

export default function RealtimeLog() {
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => addLog("✅ Connected to Socket.IO", "success"));
    socket.on("disconnect", () =>
      addLog("❌ Disconnected from server", "error")
    );

    socket.on("product_update", (data) => {
      addLog(`📦 Product updated: ${data.name} — Stock: ${data.stock}`, "info");
    });

    socket.on("product_out_of_stock", (data) => {
      addLog(`⚠️ Product out of stock: ${data.name}`, "warning");
    });

    socket.on("order_created", (data) => {
      addLog(`🛒 New order: ${data.orderId}`, "success");
    });

    socket.on("log_event", (payload) => {
      const { queue, data, time } = payload;
      addLog(`[${queue.toUpperCase()}] ${JSON.stringify(data)}`, "info");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("product_update");
      socket.off("product_out_of_stock");
      socket.off("order_created");
      socket.off("log_event");
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
        {logs.map((log, i) => (
          <div key={i} className="mb-1">
            <span className="text-gray-500">[{log.time}]</span>{" "}
            <span className={typeColors[log.type] || "text-gray-300"}>
              {log.msg}
            </span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";

function App() {
  const [count, setCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [products, setProducts] = useState({
    id: 1,
    name: "Product 1",
    price: 100,
  });

  useEffect(() => {
    // Tạo socket connection trong useEffect
    const newSocket = io("http://localhost:4001", {
      transports: ["websocket", "polling"],
    });

    console.log("🚀 ~ App.jsx ~ socket created:", newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Connected to Socket.IO");
      setIsConnected(true);
      toast.success("Connected to server!");
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.IO");
      setIsConnected(false);
      toast.error("Disconnected from server!");
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      toast.error("Connection failed!");
    });

    newSocket.on("product_updated", (data) => {
      console.log("📡 Received product update:", data);
      setProducts(data);
      toast.success("Product updated!");
    });

    newSocket.on("order_created", (data) => {
      console.log("📡 Received order created:", data);
      setProducts(data);
      toast.success("Order created successfully!");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h1 className="text-4xl font-bold text-[#F93473]">
          Hello Tailwind + React 👋
        </h1>
        <div className="mt-4 flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-sm">
            Socket: {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="w-20 h-10 bg-blue-500 flex items-center justify-center rounded">
            ID: {products.id}
          </div>
          <div className="w-20 h-10 bg-green-500 flex items-center justify-center rounded">
            {products.name}
          </div>
          <div className="w-20 h-10 bg-yellow-500 flex items-center justify-center rounded">
            ${products.price}
          </div>
        </div>
        <button
          onClick={() => toast.success("Test toast!")}
          className="mt-4 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
        >
          Test Toast
        </button>
      </div>
    </>
  );
}

export default App;

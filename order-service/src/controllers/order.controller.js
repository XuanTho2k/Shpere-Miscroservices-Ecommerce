import prisma from "../config/db.js";
import { publishToExchange } from "../utils/rabbitmq.js";

export const createOrder = async (req, res) => {
  try {
    const { productId, quantity, price } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ message: "ProductId and quantity are required" });
    }

    const order = await prisma.order.create({
      data: {
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        price: price ? parseFloat(price) : 0,
        status: "pending",
      },
    });

    // Publish order created event
    await publishToExchange("order_events", {
      event: "ORDER_CREATED",
      data: order,
      timestamp: new Date().toISOString(),
      service: "order-service",
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order", error);
    res.status(500).json({ message: error.message });
  }
};

export const upsertOrder = async (req, res) => {
  try {
    const { productId, quantity, price } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ message: "ProductId and quantity are required" });
    }

    const order = await prisma.order.upsert({
      where: { productId: parseInt(productId) },
      update: {
        quantity: parseInt(quantity),
        price: price ? parseFloat(price) : 0,
        status: "updated",
      },
      create: {
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        price: price ? parseFloat(price) : 0,
        status: "pending",
      },
    });

    // Publish order updated event
    await publishToExchange("order_events", {
      event: "ORDER_UPDATED",
      data: order,
      timestamp: new Date().toISOString(),
      service: "order-service",
    });

    res.json(order);
  } catch (error) {
    console.error("Error upserting order", error);
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    console.error("Error getting orders", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    // Publish order status updated event
    await publishToExchange("order_events", {
      event: "ORDER_STATUS_UPDATED",
      data: order,
      timestamp: new Date().toISOString(),
      service: "order-service",
    });

    res.json(order);
  } catch (error) {
    console.error("Error updating order status", error);
    res.status(500).json({ message: error.message });
  }
};

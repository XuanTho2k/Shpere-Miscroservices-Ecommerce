import prisma from "../config/db.js";
import { publishToExchange } from "../utils/rabbitmq.js";

export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }
    const product = await prisma.product.create({
      data: { name, price: parseFloat(price) },
    });

    // Publish product created event
    await publishToExchange("product_events", {
      event: "PRODUCT_CREATED",
      data: product,
      timestamp: new Date().toISOString(),
      service: "auth-product-user-service",
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { name, price: parseFloat(price) },
    });

    // Publish product updated event
    await publishToExchange("product_events", {
      event: "PRODUCT_UPDATED",
      data: product,
      timestamp: new Date().toISOString(),
      service: "auth-product-user-service",
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await prisma.product.delete({ where: { id: parseInt(id) } });

    // Publish product deleted event
    await publishToExchange("product_events", {
      event: "PRODUCT_DELETED",
      data: { id: parseInt(id), name: product.name },
      timestamp: new Date().toISOString(),
      service: "auth-product-user-service",
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { price: parseFloat(price) },
    });

    // Publish product price updated event
    await publishToExchange("product_events", {
      event: "PRODUCT_PRICE_UPDATED",
      data: product,
      timestamp: new Date().toISOString(),
      service: "auth-product-user-service",
    });

    res.json({ message: "Price updated successfully", product });
  } catch (error) {
    console.error("Error updating price", error);
    res.status(500).json({ message: error.message });
  }
};

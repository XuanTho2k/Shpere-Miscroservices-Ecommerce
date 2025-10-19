import prisma from "../config/db.js";
import { publishMessage } from "../utils/rabbitmq.js";

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
    await publishMessage("product_updates", {
      event: "PRODUCT_UPDATED",
      data: product,
    });
    await publishMessage("order_created", {
      event: "ORDER_CREATED",
      data: product,
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id: parseInt(id) } });
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

    await publishMessage("product_updates", {
      event: "PRODUCT_UPDATED",
      data: product,
    });

    res.json({ message: "Stock updated successfully", product });
  } catch (error) {
    console.log("Error updating stock", error);
  }
};

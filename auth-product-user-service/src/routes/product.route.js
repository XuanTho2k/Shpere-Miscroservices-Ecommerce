import express from "express";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { authorizeRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", authorizeRole(["admin"]), createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;

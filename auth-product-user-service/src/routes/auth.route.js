import express from "express";
import prisma from "../config/db.js";
import { login, register } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });
  res.status(200).json(user);
});

export default router;

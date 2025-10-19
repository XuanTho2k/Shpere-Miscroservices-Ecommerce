export const createOrder = async () => {
  try {
    const { productId, quantity } = req.body;
    const order = await prisma.order.create({
      data: { productId, quantity },
    });
  } catch (error) {
    console.log("Error creating order", error);
  }
};

export const upsertOrder = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const order = await prisma.order.upsert({
      where: { productId },
      update: { quantity },
      create: { productId, quantity },
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

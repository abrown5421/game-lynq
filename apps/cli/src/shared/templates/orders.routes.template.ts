export const ordersRoutesTemplate = () => `import { OrderModel } from "../entities/order/order.model";
import { createBaseCRUD } from "../shared/base";
import { Router } from "express";
import mongoose from "mongoose";

const recalcTotals = (order: any, productPrices: number[]) => {
  const itemCount = productPrices.length;
  const subtotal = productPrices.reduce((sum, p) => sum + p, 0);
  const tax = subtotal * 0.06;
  const shipping = 4 + 0.05 * itemCount;
  const total = subtotal + tax + shipping;

  order.order_item_count = itemCount;
  order.order_item_subtotal = Number(subtotal.toFixed(2));
  order.order_item_tax = Number(tax.toFixed(2));
  order.order_item_shipping = Number(shipping.toFixed(2));
  order.order_item_total = Number(total.toFixed(2));

  return order;
};

const orderRouter = createBaseCRUD(OrderModel);

const utilRouter = Router();

utilRouter.get("/pending/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const pendingOrder = await OrderModel.findOne({
      order_user_id: userId,
      order_status: "pending",
    });

    if (!pendingOrder) {
      return res.json(null);
    }

    res.json(pendingOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

utilRouter.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const orders = await OrderModel.find({
      order_user_id: userId,
    }).sort({ createdAt: -1 }); 

    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

utilRouter.post("/:orderId/add-item", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, productPrice } = req.body;

    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.order_items.push(new mongoose.Types.ObjectId(productId));

    const prices = order.order_items.map(() => productPrice);

    recalcTotals(order, prices);
    await order.save();

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

utilRouter.post("/:orderId/remove-item", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, productPrice } = req.body;

    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const index = order.order_items.findIndex((id) => id.toString() === productId);
    if (index > -1) order.order_items.splice(index, 1);

    const prices = order.order_items.map(() => productPrice);

    recalcTotals(order, prices);
    await order.save();

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

utilRouter.delete("/:orderId/remove-all/:productId", async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { productPrice } = req.body;

    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.order_items = order.order_items.filter((id) => id.toString() !== productId);

    const prices = order.order_items.map(() => productPrice);

    recalcTotals(order, prices);
    await order.save();

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

orderRouter.use("/utils", utilRouter);

export default orderRouter`

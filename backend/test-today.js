import mongoose from "mongoose";
import Order from "./modules/order/models/Order.js";

const uri = "mongodb://localhost:27017/ute_shop";

async function run() {
  try {
    await mongoose.connect(uri);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const count = await Order.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: startOfToday, $lte: endOfToday } });
    console.log("Orders created today:", count);
  } finally {
    await mongoose.disconnect();
  }
}
run();

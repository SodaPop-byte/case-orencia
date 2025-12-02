import Order from '../models/order.model.js';
import Inventory from '../models/inventory.model.js';
import Product from '../models/product.model.js';

export const generateSalesReport = async (startDate, endDate, adminId) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const salesData = await Order.aggregate([
        { $match: { status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] }, createdAt: { $gte: start, $lte: end } } },
        { $unwind: "$items" },
        {
            $group: {
                _id: { productId: "$items.productId", productName: "$items.name", SKU: "$items.SKU" },
                totalQuantitySold: { $sum: "$items.quantity" },
                totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.priceAtTimeOfOrder"] } },
                totalOrders: { $addToSet: "$_id" }
            }
        },
        {
            $project: {
                _id: 0, productId: "$_id.productId", productName: "$_id.productName", SKU: "$_id.SKU",
                quantity: "$totalQuantitySold", revenue: "$totalRevenue", uniqueOrders: { $size: "$totalOrders" }
            }
        },
        { $sort: { revenue: -1 } }
    ]);
    
    const totalRevenue = salesData.reduce((acc, item) => acc + item.revenue, 0);
    const totalUnits = salesData.reduce((acc, item) => acc + item.quantity, 0);

    return { totalRevenue, totalUnits, salesByProduct: salesData };
};

export const generateInventoryReport = async () => {
    const inventorySnapshot = await Inventory.find({}, 'itemName stockLevel').lean();
    const activeProductsCount = await Product.countDocuments({ isPublished: true, deletedAt: null });
    return { timestamp: new Date(), activeProductsCount, stockSummary: inventorySnapshot };
};
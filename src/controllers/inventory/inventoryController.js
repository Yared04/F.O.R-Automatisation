const prisma = require("../../database");
const purchaseController = require("../purchase/purchaseController");
const saleController = require("../sales/salesController");

async function getInventory(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.inventory.count();

    const inventory = await prisma.inventory.findMany({
      skip: (page - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    const inventoryDetails = await Promise.all(
      inventory.map(async (item) => {
        const purchase =
          (item.purchaseId &&
            (await purchaseController.getPurchase(item.purchaseId))) ||
          null;
        const sale =
          (item.saleId && (await saleController.getSale(item.saleId))) || null;
        return {
          ...item,
          purchase: purchase,
          sale: sale,
        };
      })
    );

    res.json({
      items: inventoryDetails,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving Inventory:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getInventory,
};

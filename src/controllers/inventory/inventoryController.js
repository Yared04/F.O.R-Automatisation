const prisma = require("../../database");
const purchaseController = require("../purchase/purchaseController");
const saleController = require("../sales/salesController");

async function getInventory(req, res) {
  try {
    const { page, pageSize } = req.query;
    const totalCount = page && pageSize ? await prisma.inventory.count() : null;

    let inventory;
    if (page && pageSize) {
      inventory = await prisma.inventory.findMany({
        include: {
          purchase: true,
          productPurchase: true,
          sale: true,
          saleDetail: true,
          product: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
      });
    } else {
      inventory = await prisma.inventory.findMany({
        include: {
          purchase: true,
          productPurchase: true,
          sale: true,
          saleDetail: true,
          product: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: inventory,
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

async function getInventoryById(req, res) {
  try {
    const inventoryId = req.params.id;
    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    const purchase =
      (inventoryItem.purchaseId &&
        (await purchaseController.getPurchase(inventoryItem.purchaseId))) ||
      null;
    const sale =
      (inventoryItem.saleId &&
        (await saleController.getSale(inventoryItem.saleId))) ||
      null;

    res.json({
      purchase: purchase,
      sale: sale,
    });
  } catch (error) {
    console.error("Error retrieving Inventory Item:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getInventory,
  getInventoryById,
};

const prisma = require("../../database");
const purchaseController = require("../purchase/purchaseController");
const saleController = require("../sales/salesController");

async function getInventory(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.inventory.count();

    const inventory = await prisma.inventory.findMany({
      select: {
        balanceQuantity: true,
        purchaseId: true,
        saleId: true,
        productPurchaseId: true,
        saleDetailId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
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
        const productPurchase =
          (item.productPurchaseId &&
            (await purchaseController.getProductPurchaseById(
              item.productPurchaseId
            ))) ||
          null;
        const sale =
          (item.saleId && (await saleController.getSale(item.saleId))) || null;
        const saleDetail =
          (item.saleDetailId &&
            (await saleController.getSaleDetailById(item.saleDetailId))) ||
          null;

        return {
          ...item,
          purchase: purchase,
          productPurchase: productPurchase,
          saleDetail: saleDetail,
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

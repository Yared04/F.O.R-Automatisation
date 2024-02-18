const prisma = require("../../database");

async function getPurchases(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.purchase.count();

    const purchases = await prisma.purchase.findMany({
      select: {
        id: true,
        date: true,
        number: true,
        truckNumber: true,
      },
      skip: (page - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: purchases,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving Purchases:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createPurchase(req, res) {
  try {
    const {
      date,
      number,
      truckNumber,
      transportCost,
      eslCustomCost,
      transitFees,
      purchaseProducts,
    } = req.body;

    const createdPurchase = await prisma.purchase.create({
      data: {
       number:parseInt(number),
        date: new Date(date),
        truckNumber,
      },
    });

    let totalPurchaseQuantity = 0;

    const createdProductPurchases = await Promise.all(
      purchaseProducts.map(async (purchaseProduct) => {
        totalPurchaseQuantity += parseFloat(purchaseProduct.purchaseQuantity);
        const createdProductPurchase = await prisma.productPurchase.create({
          data: {
            purchaseId: createdPurchase.id,
            declarationId: purchaseProduct.declarationId,
            productId: purchaseProduct.productId,
            purchaseQuantity: parseInt(purchaseProduct.purchaseQuantity),
            purchaseUnitPrice: parseInt(purchaseProduct.purchaseUnitPrice),
            purchaseTotal: purchaseProduct.purchaseQuantity * purchaseProduct.purchaseUnitPrice,
            transportCost: 0,
            eslCustomCost: 0,
            transitFees: 0,
            purchaseUnitCostOfGoods: 0,
          },
        });

        return createdProductPurchase;
      })
    );

    const updatedProductPurchases = await Promise.all(
      createdProductPurchases.map(async (productPurchase) => {
        const updatedProductPurchase = await prisma.productPurchase.update({
          where: { id: productPurchase.id },
          data: {
            transportCost:
              (transportCost * productPurchase.purchaseQuantity) /
              totalPurchaseQuantity,
            eslCustomCost:
              (eslCustomCost * productPurchase.purchaseQuantity) /
              totalPurchaseQuantity,
            transitFees:
              (transitFees * productPurchase.purchaseQuantity) /
              totalPurchaseQuantity,
            purchaseUnitCostOfGoods:
              ((transportCost * productPurchase.purchaseQuantity) /
                totalPurchaseQuantity +
                (eslCustomCost * productPurchase.purchaseQuantity) /
                  totalPurchaseQuantity +
                (transitFees * productPurchase.purchaseQuantity) /
                  totalPurchaseQuantity) /
                productPurchase.purchaseQuantity +
              productPurchase.purchaseUnitPrice,
          },
        });
        return updatedProductPurchase;
      })
    );

    res.json(createdPurchase);
  } catch (error) {
    console.error("Error creating purchase:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getPurchaseById(req, res) {
  try {
    const { id } = req.params; // Extract the declaration ID from request parameters
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: parseInt(id), // Convert id to integer if needed
      },
      select: {
        id: true,
        number: true,
        date: true,
        truckNumber: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    const purchaseProducts = await prisma.productPurchase.findMany({
      where: {
        purchaseId: parseInt(id),
      },
      select: {
        id: true,
        purchaseQuantity:true,
        purchaseUnitPrice:true,
        purchaseTotal:true,
        transportCost:true,
        transitFees:true,
        eslCustomCost:true,
        purchaseUnitCostOfGoods:true,
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unitOfMeasurement: true,
          },
        },
        declaration: {
          select: {
            id: true,
            number: true,
            date: true,
          },
        },
      },
    });

    // Combine declaration data with associated products
    const purchaseWithProducts = { ...purchase, purchaseProducts };

    res.json(purchaseWithProducts);
  } catch (error) {
    console.error("Error retrieving declaration by ID:", error);
    res.status(500).send("Internal Server Error");
  }

}
module.exports = {
  getPurchases,
  createPurchase,
  getPurchaseById
};

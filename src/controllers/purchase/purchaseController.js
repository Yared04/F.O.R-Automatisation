const { parse } = require("path");
const prisma = require("../../database");
const e = require("express");

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
        number: parseInt(number),
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
            purchaseUnitPrice: parseFloat(purchaseProduct.purchaseUnitPrice),
            purchaseTotal:
              purchaseProduct.purchaseQuantity *
              purchaseProduct.purchaseUnitPrice,
            transportCost: 0,
            eslCustomCost: 0,
            transitFees: 0,
            purchaseUnitCostOfGoods: 0,
          },
        });

        const currentDeclaration = await prisma.productDeclaration.findFirst({
          where: {
            AND: [
              { productId: purchaseProduct.productId },
              { declarationId: purchaseProduct.declarationId },
            ],
          },
        });

        if (!currentDeclaration) {
          return res
            .status(404)
            .json({ error: `Declaration for product not found` });
        }

        await prisma.productDeclaration.update({
          where: {
            id: currentDeclaration.id,
          },
          data: {
            purchasedQuantity:
              currentDeclaration.purchasedQuantity +
              parseInt(purchaseProduct.purchaseQuantity),
            declarationBalance:
              currentDeclaration.declarationQuantity -
              (currentDeclaration.purchasedQuantity +
                parseInt(purchaseProduct.purchaseQuantity)),
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
        const inventoryEntries = await prisma.inventory.findMany({
          where: {
            productId: productPurchase.productId,
          },
          select: {
            balanceQuantity: true,
            purchaseId: true,
            saleId: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        let purchaseEntry = inventoryEntries.find((entry) => entry.purchaseId);
        let saleEntry = inventoryEntries.find((entry) => entry.saleId);
        try {
          await prisma.inventory.create({
            data: {
              purchase: {
                connect: {
                  id: productPurchase.purchaseId,
                },
              },
              productPurchase: {
                connect: {
                  id: productPurchase.id,
                },
              },
              product: {
                connect: {
                  id: productPurchase.productId,
                },
              },
              balanceQuantity: saleEntry
                ? saleEntry.balanceQuantity + productPurchase.purchaseQuantity
                : purchaseEntry.balanceQuantity +
                  productPurchase.purchaseQuantity,
            },
          });
        } catch (error) {
          console.error("Error creating inventory:", error);
          res.status(500).send("Internal Server Error");
        }

        return updatedProductPurchase;
      })
    );

    res.json(createdPurchase);
  } catch (error) {
    console.error("Error creating purchase:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getPurchase(id) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: id,
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

    return purchase;
  } catch (error) {
    console.error("Error retrieving purchase:", error);
    return res.status(500).send("Internal Server Error");
  }
}

async function getProductPurchaseById(id) {
  try {
    const productPurchase = await prisma.productPurchase.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        purchaseQuantity: true,
        purchaseUnitPrice: true,
        purchaseTotal: true,
        transportCost: true,
        eslCustomCost: true,
        transitFees: true,
        purchaseUnitCostOfGoods: true,
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
    return productPurchase;
  } catch (error) {
    console.error("Error retrieving product purchase:", error);
    return res.status(500).send("Internal Server Error");
  }
}

async function getProductPurchases(id) {
  try {
    const productPurchases = await prisma.productPurchase.findMany({
      where: {
        purchaseId: id,
      },
      select: {
        id: true,
        purchaseQuantity: true,
        purchaseUnitPrice: true,
        purchaseTotal: true,
        transportCost: true,
        eslCustomCost: true,
        transitFees: true,
        purchaseUnitCostOfGoods: true,
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
    return productPurchases;
  } catch (error) {
    console.error("Error retrieving product purchase:", error);
    return res.status(500).send("Internal Server Error");
  }
}

async function getPurchaseById(req, res) {
  try {
    const { id } = req.params;
    const purchase = await getPurchase(id);
    const productPurchases = await getProductPurchases(id);

    res.json({ ...purchase, productPurchases });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).send(error.message);
  }
}

async function updatePurchase(req, res) {
  try {
    const { id } = req.params;
    const {
      date,
      number,
      truckNumber,
      transportCost,
      eslCustomCost,
      transitFees,
      purchaseProducts,
    } = req.body;

    const updatedPurchase = await prisma.purchase.update({
      where: { id: parseInt(id) },
      data: {
        date: new Date(date),
        number,
        truckNumber,
      },
    });

    const updatedProductPurchases = await Promise.all(
      purchaseProducts.map(async (purchaseProduct) => {
        const updatedProductPurchase = await prisma.productPurchase.upsert({
          where: { purchaseId: purchaseProduct.purchaseId },
          update: {
            purchaseQuantity: purchaseProduct.purchaseQuantity,
            purchaseUnitPrice: purchaseProduct.purchaseUnitPrice,
            purchaseTotal:
              purchaseProduct.purchaseQuantity *
              purchaseProduct.purchaseUnitPrice,
            transportCost: purchaseProduct.transportCost,
            eslCustomCost: purchaseProduct.eslCustomCost,
            transitFees: purchaseProduct.transitFees,
            purchaseUnitCostOfGoods: purchaseProduct.purchaseUnitCostOfGoods,
          },
          create: {
            purchaseId: updatedPurchase.id,
            declarationId: purchaseProduct.declarationId,
            productId: purchaseProduct.productId,
            purchaseQuantity: purchaseProduct.purchaseQuantity,
            purchaseUnitPrice: purchaseProduct.purchaseUnitPrice,
            purchaseTotal:
              purchaseProduct.purchaseQuantity *
              purchaseProduct.purchaseUnitPrice,
            transportCost: purchaseProduct.transportCost,
            eslCustomCost: purchaseProduct.eslCustomCost,
            transitFees: purchaseProduct.transitFees,
            purchaseUnitCostOfGoods: purchaseProduct.purchaseUnitCostOfGoods,
          },
        });
        return updatedProductPurchase;
      })
    );

    res.json({ updatedPurchase, updatedProductPurchases });
  } catch (error) {
    console.error("Error updating purchase:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deletePurchase(req, res) {
  try {
    const { id } = req.params;

    await prisma.productPurchase.deleteMany({
      where: { purchaseId: parseInt(id) },
    });

    await prisma.purchase.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Purchase deleted successfully" });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getPurchases,
  createPurchase,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getPurchase,
  getProductPurchases,
  getProductPurchaseById,
};

const prisma = require("../../database");
const {
  createTransaction,
} = require("../caTransaction/caTransactionController");

async function getSales(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.sale.count();

    const sales = await prisma.Sale.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        customer: true,
      },
      skip: (page - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: sales,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving Sales:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createSale(req, res) {
  try {
    const { invoiceNumber, invoiceDate, customerId, products } = req.body;

    const createdSale = await prisma.sale.create({
      data: {
        invoiceNumber: parseInt(invoiceNumber),
        invoiceDate: new Date(invoiceDate),
        customer: {
          connect: { id: customerId },
        },
      },
      include: {
        customer: true,
      },
    });

    const saleId = createdSale.id;
    products.map(async (product) => {
      const availableProducts = await prisma.productPurchase.findMany({
        where: {
          productId: product.productId,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          purchaseQuantity: true,
          declarationId: true,
          purchaseId: true,
          productId: true,
          purchaseUnitCostOfGoods: true,
        },
      });

      const totalPurchaseQuantity = availableProducts.reduce(
        (acc, item) => acc + item.purchaseQuantity,
        0
      );

      let remainingSaleQuantity = parseInt(product.saleQuantity);
      let productPurchaseIndex = 0;
      if (remainingSaleQuantity > totalPurchaseQuantity) {
        res.status(400).json({ message: "Not Engough Products for Sale!" });
        return;
      }
      let sale = null;
      while (remainingSaleQuantity > 0) {
        const productPurchase = availableProducts[productPurchaseIndex];
        const productDeclaration = await prisma.productDeclaration.findFirst({
          where: {
            productId: productPurchase.productId,
            declarationId: productPurchase.declarationId,
          },
          select: {
            unitIncomeTax: true,
          },
        });
        if (productPurchase.purchaseQuantity >= remainingSaleQuantity) {
          sale = await prisma.saleDetail.create({
            data: {
              saleQuantity: remainingSaleQuantity,
              saleUnitPrice: parseFloat(product.saleUnitPrice),
              totalSales:
                parseFloat(product.saleUnitPrice) * remainingSaleQuantity,
              unitCostOfGoods:
                productPurchase.purchaseUnitCostOfGoods +
                productDeclaration.unitIncomeTax,
              purchase: { connect: { id: productPurchase.purchaseId } },
              declaration: { connect: { id: productPurchase.declarationId } },
              product: { connect: { id: productPurchase.productId } },
              sale: { connect: { id: saleId } },
            },
          });

          await prisma.productPurchase.update({
            where: {
              id: productPurchase.id,
            },
            data: {
              purchaseQuantity:
                productPurchase.purchaseQuantity - remainingSaleQuantity,
            },
          });

          remainingSaleQuantity = 0;
        } else {
          sale = await prisma.saleDetail.create({
            data: {
              saleQuantity: productPurchase.purchaseQuantity,
              saleUnitPrice: parseFloat(product.saleUnitPrice),
              totalSales:
                product.saleUnitPrice * productPurchase.purchaseQuantity,
              unitCostOfGoods:
                productPurchase.purchaseUnitCostOfGoods +
                productDeclaration.unitIncomeTax,
              purchase: { connect: { id: productPurchase.purchaseId } },
              declaration: { connect: { id: productPurchase.declarationId } },
              product: { connect: { id: productPurchase.productId } },
              sale: { connect: { id: saleId } },
            },
          });

          await prisma.productPurchase.update({
            where: {
              id: productPurchase.id,
            },
            data: {
              purchaseQuantity: 0,
            },
          });

          remainingSaleQuantity -= productPurchase.purchaseQuantity;
          productPurchaseIndex += 1;
        }
      }

      const inventoryEntries = await prisma.inventory.findMany({
        where: {
          productId: product.productId,
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
            saleId: saleId,
            saleDetailId: sale.id,
            productId: product.productId,
            balanceQuantity: saleEntry
              ? saleEntry.balanceQuantity - product.saleQuantity
              : purchaseEntry.balanceQuantity - product.saleQuantity,
          },
        });
      } catch (error) {
        console.error("Error creating inventory:", error);
        res.status(500).send("Internal Server Error");
      }

      const transaction = await createTransaction(
        "6827d1d2-4706-46f5-bd07-4586c27088a0",
        "6e57436a-8c19-426a-a260-f8fc5e6de0e1",
        new Date(invoiceDate),
        `sale`,
        null,
        product.saleQuantity,
        null,
        createdSale.id,
        null
      );

      const transaction2 = await createTransaction(
        "e89567ac-44f0-4b45-810d-9e66c1294bc0",
        "a0fc9f57-7a97-49d7-8b43-2a1f4d54669d",
        new Date(invoiceDate),
        `sale`,
        product.saleQuantity * sale.unitCostOfGoods,
        null,
        null,
        createdSale.id,
        null
      );
    });

    res.json(createdSale);
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getSaleDetails(id) {
  try {
    const saleDetails = await prisma.saleDetail.findMany({
      where: {
        saleId: id,
      },
      select: {
        id: true,
        saleQuantity: true,
        saleUnitPrice: true,
        totalSales: true,
        unitCostOfGoods: true,
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
        purchase: {
          select: {
            id: true,
            number: true,
            date: true,
          },
        },
      },
    });
    return saleDetails;
  } catch (error) {
    console.error("Error retrieving Sale Details:", error);
    return res.status(500).send("Internal Server Error");
  }
}

async function getSaleDetailById(id) {
  try {
    const saleDetail = await prisma.saleDetail.findUnique({
      where: {
        id: id,
      },
      include: {
        product: true,
        declaration: true,
        purchase: true,
      },
    });

    return saleDetail;
  } catch (error) {
    console.error("Error retrieving Sale Detail:", error);
    return res.status(500).send("Internal Server Error");
  }
}

async function getSale(id) {
  try {
    const sale = await prisma.sale.findUnique({
      where: {
        id: id,
      },
      include: {
        customer: true,
      },
    });

    return sale;
  } catch (error) {
    console.error("Error retrieving Sale:", error);
    return res.status(500).send("Internal Server Error");
  }
}

async function getSaleById(req, res) {
  try {
    const { id } = req.params;
    const sale = await getSale(id);
    const saleDetails = await getSaleDetails(id);
    res.json({ ...sale, saleDetails });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).send(error.message);
  }
}

module.exports = {
  getSales,
  createSale,
  getSaleById,
  getSale,
  getSaleDetails,
  getSaleDetailById,
};

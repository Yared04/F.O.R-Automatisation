const prisma = require("../../database");

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
        customerId: customerId,
      },
    });

    const availableProducts = await prisma.productPurchase.findMany({
      where: {
        productId: products.productId,
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
      },
    });

    console.log("availableProducts: ",availableProducts)

    let remainingSaleQuantity = products.saleQuantity;
    let productPurchaseIndex = 0;
    while (remainingSaleQuantity > 0) {
      if (productPurchaseIndex >= availableProducts.length()) {
        throw Error("Not Engough Products for Sale!");
      }
      const productPurchase = availableProducts[productPurchaseIndex];
      if (productPurchase.purchaseQuantity >= remainingSaleQuantity) {
        await prisma.saleDetail.create({
          data: {
            saleQuantity: remainingSaleQuantity,
            saleUnitPrice: products.saleUnitPrice,
            totalSales: products.saleUnitPrice * remainingSaleQuantity,
            unitCostOfGoods: 0,
            purchaseId: productPurchase.purchaseId,
            declarationId: productPurchase.declarationId,
            productId: productPurchase.productId,
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
        await prisma.saleDetail.create({
          data: {
            saleQuantity: remainingSaleQuantity,
            saleUnitPrice: products.saleUnitPrice,
            totalSales: products.saleUnitPrice * remainingSaleQuantity,
            unitCostOfGoods: 0,
            purchaseId: productPurchase.purchaseId,
            declarationId: productPurchase.declarationId,
            productId: productPurchase.productId,
          },
        });

        await prisma.productPurchase.delete({
          where: {
            id: productPurchase.id,
          },
        });

        remainingSaleQuantity -= productPurchase.purchaseQuantity;
        productPurchaseIndex += 1;
      }
    }

    res.json(createdSale);
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).send("Internal Server Error");
  }
}


module.exports = {
    getSales, 
    createSale

};
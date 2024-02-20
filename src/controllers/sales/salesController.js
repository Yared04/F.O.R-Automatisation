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

    const totalPurchaseQuantity = availableProducts.reduce((acc, item) => acc + item.purchaseQuantity, 0);

    products.map(async (product)=>{
      let remainingSaleQuantity = product.saleQuantity;
      let productPurchaseIndex = 0;
      if(remainingSaleQuantity > totalPurchaseQuantity){
        return res.status(400).json({message: "Not Engough Products for Sale!"});
      }
      while (remainingSaleQuantity > 0) {
        const productPurchase = availableProducts[productPurchaseIndex];
        if (productPurchase.purchaseQuantity >= remainingSaleQuantity) {
          await prisma.saleDetail.create({
            data: {
              saleQuantity: remainingSaleQuantity,
              saleUnitPrice: product.saleUnitPrice,
              totalSales: product.saleUnitPrice * remainingSaleQuantity,
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
              saleQuantity: productPurchase.purchaseQuantity,
              saleUnitPrice: product.saleUnitPrice,
              totalSales: product.saleUnitPrice * productPurchase.purchaseQuantity,
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
              purchaseQuantity:0,
            },
          });
  
          remainingSaleQuantity -= productPurchase.purchaseQuantity;
          productPurchaseIndex += 1;
        }
      }

    })


    res.json(createdSale);
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getSaleById(req, res) {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    const saleDetails = await prisma.saleDetail.findMany({
      where: {
        saleId: parseInt(id),
      },
      select: {
        id: true,
        saleQuantity: true,
        saleUnitPrice: true,
        totalSales: true,
        unitCostOfGoods: true,
        purchaseId: true,
        declarationId: true,
        productId: true,
      },
    });

    res.json({sale, saleDetails});
  } catch (error) {
    console.error("Error retrieving Sale:", error);
    res.status(500).send("Internal Server Error");
  }
}


module.exports = {
    getSales, 
    createSale

};
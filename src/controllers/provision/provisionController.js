const prisma = require("../../database");

async function getProvisions(req, res) {
  try {
    const { page, pageSize } = req.query;
    const totalCount = await prisma.provision.count();

    let provisions;
    if (page && pageSize) {
      provisions = await prisma.provision.findMany({
        select: {
          id: true,
          date: true,
          saleDetail: {
            select: {
                product: true,
                purchase: true,
                declaration: true,
                unitCostOfGoods: true,
                saleQuantity: true,
                productPurchase: {
                  select:{
                    transit: true,
                    transport: true,
                    esl: true,
                    purchaseUnitCostOfGoods: true,
                  }
                },
            }
          },
        },
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
      });
    } else {
      provisions = await prisma.provision.findMany({
        select: {
          id: true,          
          date: true,
          saleDetail: {
            select: {
                product: true,
                purchase: true,
                declaration: true,
                unitCostOfGoods: true,
                saleQuantity: true,
                productPurchase: {
                  select:{
                    transit: true,
                    transport: true,
                    esl: true,
                    purchaseUnitCostOfGoods: true,
                  }
                },
            }
        }
        },
      });
    }

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: provisions,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving provisions:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getProvisions,
};

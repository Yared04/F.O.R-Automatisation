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
          productDeclaration: true,
          saleDetail: {
            select: {
              product: true,
              purchase: true,
              declaration: true,
              unitCostOfGoods: true,
              saleQuantity: true,
              sale: true,
              productPurchase: {
                select: {
                  transit: true,
                  transport: true,
                  esl: true,
                  purchaseUnitCostOfGoods: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
      });
    } else {
      provisions = await prisma.provision.findMany({
        select: {
          id: true,
          date: true,
          productDeclaration: true,
          saleDetail: {
            select: {
              product: true,
              purchase: true,
              declaration: true,
              unitCostOfGoods: true,
              sale: true,
              saleQuantity: true,
              productPurchase: {
                select: {
                  transit: true,
                  transport: true,
                  esl: true,
                  purchaseUnitCostOfGoods: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
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

async function getProvisionsByMonth(req, res) {
  try {
    const { month, year } = req.query;
    const provisions = await prisma.provision.findMany({
      where: {
        date: {
          gte: new Date(`${year}-${month}-01`),
          lt: new Date(`${year}-${month}-31`),
        },
      },
      select: {
        id: true,
        date: true,
        productDeclaration: true,
        saleDetail: {
          select: {
            product: true,
            purchase: true,
            declaration: true,
            unitCostOfGoods: true,
            sale: true,
            saleQuantity: true,
            productPurchase: {
              select: {
                transit: true,
                transport: true,
                esl: true,
                purchaseUnitCostOfGoods: true,
              },
            },
          },
        },
      },
    });

    res.json({ items: provisions });
  } catch (error) {
    console.error("Error retrieving provisions:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getProvisions,
  getProvisionsByMonth,
};

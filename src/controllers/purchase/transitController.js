const prisma = require("../../database");

async function createTransitFee(req, res) {
  try {
    const { date, cost, paidAmount, type, purchaseId } = req.body;
    const transitFee = await prisma.transit.create({
      data: {
        date: new Date(date),
        cost: parseFloat(cost),
        paidAmount: parseFloat(paidAmount),
        type: type,
        purchase: {
          connect: {
            id: purchaseId,
          },
        },
      },
    });

    res.json(transitFee);
  } catch (error) {
    console.error("Error creating transit fee:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createTransitPayment(req, res) {
  const { amount, date, transits } = req.body;
  try {
    const transitPayment = await prisma.TransitPayment.create({
      data: {
        date: new Date(date),
        amount: parseFloat(amount),
      },
    });

    console.log(transits);

    await Promise.all(
      transits.map(async (transit) => {
        await prisma.transit.update({
          where: { id: transit.id },
          data: {
            transitPayment: {
              connect: {
                id: transitPayment.id,
              },
            },
            paymentStatus: transit.paymentStatus,
            paidAmount: transit.paidAmount,
          },
        });
      })
    );

    res.json(transitPayment);
  } catch (error) {
    console.error("Error creating transit payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getTransitPayments(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;

    let transitPayments;
    let totalCount;

    if (page && pageSize) {
      totalCount = await prisma.TransitPayment.count();
      transitPayments = await prisma.TransitPayment.findMany({
        include: {
          transits: true,
        },
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
        orderBy: { createdAt: "desc" },
      });
    } else {
      transitPayments = await prisma.TransitPayment.findMany({
        include: {
          transits: true,
        },
        orderBy: { createdAt: "desc" },
      });
      totalCount = transitPayments.length;
    }

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));
    res.json({
      items: transitPayments,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error getting transit payments: ", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createTransitFee,
  createTransitPayment,
  getTransitPayments,
};

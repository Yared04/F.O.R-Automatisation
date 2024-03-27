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
  const { amount, transits } = req.body;
  try {
    const transitPayment = await prisma.transitPayment.create({
      data: {
        amount: parseFloat(amount),
      },
    });

    transits.map((transit) => {
      prisma.transit.update({
        where: { id: transit.id },
        data: {
          transitPayment: {
            connect: {
              id: transitPayment.id,
            },
          },
          paymentStatus: transit.paymentStatus,
        },
      });
    });

    res.json(transitPayment);
  } catch (error) {
    console.error("Error creating transit payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getTransitPayments(req, res) {
  try {
    const transitPayments = await prisma.transitPayment.findMany({
      include: {
        transits: true,
      },
    });

    res.json(transitPayments);
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

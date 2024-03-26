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

module.exports = {
  createTransitFee,
};

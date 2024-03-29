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
  const { date, transits } = req.body;
  try {
    await Promise.all(
      transits.map(async (transit) => {
        await prisma.transit.create({
          data: {
            date: new Date(date),
            paidAmount: parseFloat(transit.paidAmount),
            type: "Payment",
            paymentStatus: "",
            purchase: {
              connect: {
                id: transit.purchase.id,
              },
            },
          },
        });
        await prisma.transit.update({
          where: { id: transit.id },
          data: {
            paymentStatus: transit.paymentStatus,
            paidAmount: transit.paidAmount,
          },
        });
      })
    );

    res.json({ message: "Payment successful" });
  } catch (error) {
    console.error("Error creating transit payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createTransitFee,
  createTransitPayment,
};

const { parse } = require("path");
const prisma = require("../../database");

async function createTransportPayment(req, res) {
  try {
    const { date, cost, paidAmount, type, purchaseId } = req.body;

    const transport = await prisma.transport.create({
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

    res.json(transport);
  } catch (error) {
    console.error("Error creating transport:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createTransportPayment,
};

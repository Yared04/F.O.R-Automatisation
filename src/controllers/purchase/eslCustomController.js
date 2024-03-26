const prisma = require("../../database");

async function createCustomTaxPayment(req, res) {
  try {
    const { date, cost, paidAmount, type, purchaseId } = req.body;
    const customTax= await prisma.esl.create({
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

    res.json(customTax);
  } catch (error) {
    console.error("Error creating transit fee:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createCustomTaxPayment,
};

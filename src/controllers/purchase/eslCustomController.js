const prisma = require("../../database");

async function createCustomTaxPayment(req, res) {
  try {
    const { date, cost, paidAmount, type, purchaseId } = req.body;
    const customTax = await prisma.esl.create({
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

async function createESLPayment(req, res) {
  const { amount, date, customs } = req.body;
  try {
    const eslPayment = await prisma.ESLPayment.create({
      data: {
        date: new Date(date),
        amount: parseFloat(amount),
      },
    });


    
    await Promise.all(
      customs.map(async (custom) => {
        await prisma.esl.update({
          where: { id: custom.id },
          data: {
            eslPayment: {
              connect: {
                id: eslPayment.id,
              },
            },
            paymentStatus: custom.paymentStatus,
            paidAmount: custom.paidAmount,
          },
        });
      })
    );

    res.json(eslPayment);
  } catch (error) {
    console.error("Error creating transit payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createCustomTaxPayment,
  createESLPayment,
};

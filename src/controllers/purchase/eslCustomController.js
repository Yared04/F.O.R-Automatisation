const prisma = require("../../database");

async function createCustomTaxPayment(req, res) {
  try {
    const { date, cost, paidAmount, type, purchaseId } = req.body;
    const customTax = await prisma.eSL.create({
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
  const { date, esls } = req.body;
  try {
    await Promise.all(
      esls.map(async (custom) => {
        await prisma.eSL.create({
          data: {
            date: new Date(date),
            paidAmount: parseFloat(custom.paidAmount),
            type: "Payment",
            paymentStatus: "",
            purchase: {
              connect: {
                id: custom.purchase.id,
              },
            },
          },
        });
        await prisma.eSL.update({
          where: { id: custom.id },
          data: {
            paymentStatus: custom.paymentStatus,
            paidAmount: custom.paidAmount,
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
  createCustomTaxPayment,
  createESLPayment,
};

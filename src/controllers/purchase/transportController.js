const prisma = require("../../database");

async function createTransportPayment(req, res) {
  try {
    const { date, transports } = req.body;
    await Promise.all(
      transports.map(async (transport) => {
        await prisma.transport.create({
          data: {
            date: new Date(date),
            paidAmount: parseFloat(transport.paidAmount),
            type: "Payment",
            paymentStatus: "",
            purchase: {
              connect: {
                id: transport.purchase.id,
              },
            },
          },
        });
        await prisma.transport.update({
          where: { id: transport.id },
          data: {
            paymentStatus: transport.paymentStatus,
            paidAmount: transport.paidAmount,
          },
        });
      })
    );

    res.json({ message: "Payment successful" });
  } catch (error) {
    console.error("Error creating transport:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createTransportPayment,
};

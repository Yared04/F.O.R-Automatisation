const prisma = require("../../database");

async function createTransportPayment(req, res) {
  try {
    const {
      bankId,
      date,
      remark,
      credit,
      debit,
      supplierId,
      purchaseId,
      type,
      chartofAccountId,
      transports,
      payee,
      payment,
      deposit,
    } = req.body;

    // const bankTransactions = await prisma.bankTransaction.findMany({
    //   where: { bankId: bankId },
    //   orderBy: { date: "desc" },
    // });

    // const supplier = payee
    //   ? await prisma.supplier.findUnique({
    //       where: { id: payee },
    //     })
    //   : null;

    // const bankTransaction = await prisma.bankTransaction.create({
    //   data: {
    //     bankId: bankId,
    //     payee: supplier ? supplier.name : null,
    //     payment: parseFloat(payment),
    //     deposit: parseFloat(deposit),
    //     type: type,
    //     chartofAccountId: chartofAccountId,
    //     date: new Date(date),
    //     balance: bankTransactions[0]
    //       ? parseFloat(Number(bankTransactions[0].balance)) -
    //         parseFloat(Number(payment)) +
    //         parseFloat(Number(deposit))
    //       : parseFloat(Number(deposit)) - parseFloat(Number(payment)),
    //   },
    // });


    // Find the latest bank transaction before the new transaction's date
    const previousTransaction = await prisma.bankTransaction.findFirst({
      where: { bankId: bankId, date: { lt: new Date(date) } },
      orderBy: { date: "desc" },
    });

    // Calculate the new balance
    const previousBalance = previousTransaction ? parseFloat(previousTransaction.balance) : 0;
    const newBalance = previousBalance - parseFloat(payment) + parseFloat(deposit);

    // Create the new bank transaction
    const bankTransaction = await prisma.bankTransaction.create({
      data: {
        bank: { connect: { id: bankId } },
        payee: payee ? (await prisma.supplier.findUnique({ where: { id: payee } })).name : null,
        foreignCurrency: parseFloat(foreignCurrency),
        balance: newBalance,
        payment: parseFloat(payment),
        deposit: parseFloat(deposit),
        type: type,
        chartofAccount: chartofAccountId ? { connect: { id: chartofAccountId } } : undefined,
        exchangeRate: parseFloat(exchangeRate),
        date: new Date(date),
      },
    });

    // Update the balances of transactions created after the new transaction's date
    const subsequentTransactions = await prisma.bankTransaction.findMany({
      where: { bankId: bankId, date: { gt: new Date(date) } },
      orderBy: { date: "asc" },
    });

    let currentBalance = newBalance;

    for (const transaction of subsequentTransactions) {
      currentBalance = currentBalance - parseFloat(transaction.payment) + parseFloat(transaction.deposit);

      await prisma.bankTransaction.update({
        where: { id: transaction.id },
        data: { balance: currentBalance },
      });
    }
    // Create first transaction
    const firstTransaction = await prisma.cATransaction.create({
      data: {
        bankTransactionId: bankTransaction.id,
        date: new Date(date),
        remark: remark,
        type: type,
        credit: parseFloat(credit),
        supplierId: supplierId,
      },
    });

    // Create second transaction
    const secondTransaction = await prisma.cATransaction.create({
      data: {
        chartofAccountId: chartofAccountId,
        date: new Date(date),
        remark: remark,
        type: type,
        debit: parseFloat(debit),
        supplierId: supplierId,
      },
    });

    await Promise.all(
      transports.map(async (transport) => {
        // Create a new payment record
        const newPayment = await prisma.transport.create({
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

        // Update existing transport record with new paid amount and payment status
        const existingtransport = await prisma.transport.findUnique({
          where: { id: transport.id },
        });
        const newPaidAmount =
          existingtransport.paidAmount + parseFloat(transport.paidAmount);
        await prisma.transport.update({
          where: { id: transport.id },
          data: {
            paymentStatus: transport.paymentStatus,
            paidAmount: newPaidAmount,
          },
        });

        // Create entry in transportPaymentDetail table
        await prisma.transportPaymentDetail.create({
          data: {
            transportId: transport.id,
            paymentId: newPayment.id,
            amountPaid: parseFloat(transport.paidAmount),
          },
        });

        // Create entries in transportPaymentLog
        const newtransportPaymentLog = await prisma.transportPaymentLog.create({
          data: {
            paymentId: newPayment.id,
            caTransactionId1: firstTransaction.id, // Use the ID of the first transaction
            caTransactionId2: secondTransaction.id, // Use the ID of the second transaction
            bankTransactionId: bankTransaction.id,
          },
        });
      })
    );

    res.json({ message: "Payment successful" });
  } catch (error) {
    console.error("Error creating transport payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteTransportPayment(req, res) {
  try {
    const { paymentId } = req.params;

    const paymentDetails = await prisma.transportPaymentLog.findFirst({
      where: { paymentId: paymentId },
      include: {
        caTransaction1: true,
        caTransaction2: true,
        bankTransaction: true,
      },
    });

    // Extract relevant data
    const { caTransaction1, caTransaction2, bankTransaction } = paymentDetails;

    const paymentLogs = await prisma.transportPaymentLog.findMany({
      where: {
        caTransactionId1: caTransaction1.id,
        caTransactionId2: caTransaction2.id,
        bankTransactionId: bankTransaction.id,
      },
    });

    const transportPaymentDetails =
      await prisma.transportPaymentDetail.findMany({
        where: {
          paymentId: {
            in: paymentLogs.map((log) => log.paymentId),
          },
        },
      });

    await Promise.all(
      transportPaymentDetails.map(async (paymentDetail) => {
        const transportExpense = await prisma.transport.findUnique({
          where: { id: paymentDetail.transportId },
        });
        await prisma.transport.update({
          where: { id: transportExpense.id },
          data: {
            paidAmount: transportExpense.paidAmount - paymentDetail.amountPaid,
            paymentStatus:
              transportExpense.paidAmount - paymentDetail.amountPaid === 0
                ? "Incomplete"
                : "Partially Complete",
          },
        });

        // Delete the payment detail entries
        await prisma.transportPaymentDetail.deleteMany({
          where: { paymentId: paymentDetail.paymentId },
        });

        // Delete the payment log entries
        await prisma.transportPaymentLog.deleteMany({
          where: { paymentId: paymentDetail.paymentId },
        });

        // Delete the transport payment itself
        await prisma.transport.delete({
          where: { id: paymentDetail.paymentId },
        });
      })
    );

    await prisma.cATransaction.deleteMany({
      where: {
        OR: [{ id: caTransaction1.id }, { id: caTransaction2.id }],
      },
    });

    const subsequentBankTransactions = await prisma.bankTransaction.findMany({
      where: {
        bankId: bankTransaction.bankId,
        date: { gt: bankTransaction.date },
      },
    });

    // Update the balance of subsequent bank transactions by adding the payment amount
    await Promise.all(
      subsequentBankTransactions.map(async (transaction) => {
        await prisma.bankTransaction.update({
          where: { id: transaction.id },
          data: { balance: transaction.balance + bankTransaction.payment },
        });
      })
    );

    await prisma.bankTransaction.delete({ where: { id: bankTransaction.id } });

    res.json({ message: "Transport payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting transport payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createTransportPayment,
  deleteTransportPayment,
};

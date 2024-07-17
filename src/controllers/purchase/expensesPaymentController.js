const prisma = require("../../database");

async function createExpensesPayment(req, res) {
  try {
    const {
      bankId,
      date,
      remark,
      credit,
      debit,
      type,
      chartofAccountId,
      payee,
      foreignCurrency,
      payment,
      deposit,
      exchangeRate,
    } = req.body;

    const bankTransactions = await prisma.bankTransaction.findMany({
      where: { bankId: bankId },
      orderBy: { date: "desc" },
    });

    const supplier = payee
      ? await prisma.supplier.findUnique({
          where: { id: payee },
        })
      : null;

    const bankTransaction = await prisma.bankTransaction.create({
      data: {
        bank: {
          connect: {
            id: bankId,
          },
        },
        payee: supplier ? supplier.name : null,
        foreignCurrency: parseFloat(foreignCurrency),
        balance: bankTransactions[0]
          ? parseFloat(Number(bankTransactions[0].balance)) -
            parseFloat(Number(payment)) +
            parseFloat(Number(deposit))
          : parseFloat(Number(deposit)) - parseFloat(Number(payment)),
        payment: parseFloat(payment),
        deposit: parseFloat(deposit),
        type: type,
        chartofAccount: chartofAccountId
          ? {
              connect: { id: chartofAccountId },
            }
          : undefined,
        exchangeRate: exchangeRate,
        date: new Date(date),
      },
    });

    // Create first transaction
    const firstTransaction = await prisma.cATransaction.create({
      data: {
        bankTransactionId: bankTransaction.id,
        date: new Date(date),
        remark: remark,
        type: type,
        credit: parseFloat(credit),
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
        exchangeRate: exchangeRate,
      },
    });

    const newExpensesPaymentLog = await prisma.expensesPaymentLog.create({
      data: {
        caTransactionId1: firstTransaction.id, // Use the ID of the first transaction
        caTransactionId2: secondTransaction.id, // Use the ID of the second transaction
        bankTransactionId: bankTransaction.id,
      },
    });
    res.json({ message: "Payment successful" });
  } catch (error) {
    console.error("Error creating supplier payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteExpensesPayment(req, res) {
  try {
    const { transactionId } = req.params;

    // Find the log entry corresponding to the CA transaction
    const logEntry = await prisma.expensesPaymentLog.findFirst({
      where: {
        OR: [
          { caTransactionId1: transactionId },
          { caTransactionId2: transactionId },
        ],
      },
    });

    if (!logEntry) {
      return res
        .status(404)
        .json({ error: "Log entry not found for the transaction" });
    }

    const { bankTransactionId, caTransactionId1, caTransactionId2 } = logEntry;

    // Delete the CA transactions
    const deletedEntries = await prisma.cATransaction.findMany({
      where: { OR: [{ id: caTransactionId1 }, { id: caTransactionId2 }] },
    });

    await prisma.cATransaction.deleteMany({
      where: { OR: [{ id: caTransactionId1 }, { id: caTransactionId2 }] },
    });

    // Delete the bank transaction
    const bankTransaction = await prisma.bankTransaction.findFirst({
      where: { id: bankTransactionId },
    });

    const subsequentBankTransactions = await prisma.bankTransaction.findMany({
      where: {
        bankId: bankTransaction.bankId,
        createdAt: { gt: bankTransaction.createdAt },
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
    
    res.json(deletedEntries);
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createExpensesPayment,
  deleteExpensesPayment,
};

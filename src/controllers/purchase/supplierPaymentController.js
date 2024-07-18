const prisma = require("../../database");

async function createSupplierPayment(req, res) {
  try {
    const {
      bankId,
      date,
      purchases,
      remark,
      debit,
      supplierId,
      type,
      chartofAccountId,
      credit,
      USDAmount,
      payee,
      foreignCurrency,
      payment,
      deposit,
      exchangeRate,
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
    //     bank: {
    //       connect: {
    //         id: bankId,
    //       },
    //     },
    //     payee: supplier ? supplier.name : null,
    //     foreignCurrency: parseFloat(foreignCurrency),
    //     balance: bankTransactions[0]
    //       ? parseFloat(Number(bankTransactions[0].balance)) -
    //         parseFloat(Number(payment)) +
    //         parseFloat(Number(deposit))
    //       : parseFloat(Number(deposit)) - parseFloat(Number(payment)),
    //     payment: parseFloat(payment),
    //     deposit: parseFloat(deposit),
    //     type: type,
    //     chartofAccount: chartofAccountId
    //       ? {
    //           connect: { id: chartofAccountId },
    //         }
    //       : undefined,
    //     exchangeRate: exchangeRate,
    //     date: new Date(date),
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
        debit: parseFloat(debit),
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
        credit: parseFloat(credit),
        supplierId: supplierId,
        exchangeRate: exchangeRate,
        USDAmount: USDAmount,
      },
    });

    await Promise.all(
      purchases.map(async (purchase) => {
        const newPayment = await prisma.purchase.create({
          data: {
            supplier: {
              connect: {
                id: purchase.supplier.id,
              },
            },
            date: new Date(date),
            number: purchase.number,
            exchangeRate: exchangeRate,
            paymentStatus: "",
            paidAmountUSD: purchase.paidAmountUSD,
            paidAmountETB: purchase.paidAmountETB,
          },
        });

        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            paidAmountETB: {
              increment: purchase.paidAmountETB, // Increment by the value of purchase.paidAmountETB
            },
            paidAmountUSD: {
              increment: purchase.paidAmountUSD, // Increment by the value of purchase.paidAmountUSD
            },
            paymentStatus: purchase.paymentStatus,
          },
        });

        // Create entry in transitPaymentDetail table
        await prisma.supplierPaymentDetail.create({
          data: {
            purchaseId: purchase.id,
            paymentId: newPayment.id,
            amountPaidUSD: parseFloat(purchase.paidAmountUSD),
            amountPaidETB: parseFloat(purchase.paidAmountETB),
          },
        });

        // Create entries in transitPaymentLog
        const newSupplierPaymentLog = await prisma.supplierPaymentLog.create({
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
    console.error("Error creating supplier payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteSupplierPayment(paymentId) {
  try {

    // Retrieve the payment details, including associated transactions and logs
    const paymentDetails = await prisma.supplierPaymentLog.findFirst({
      where: { paymentId: paymentId },
      include: {
        caTransaction1: true,
        caTransaction2: true,
        bankTransaction: true,
      },
    });

    // Extract relevant data
    const { caTransaction1, caTransaction2, bankTransaction } = paymentDetails;

    const paymentLogs = await prisma.supplierPaymentLog.findMany({
      where: {
        caTransactionId1: caTransaction1.id,
        caTransactionId2: caTransaction2.id,
        bankTransactionId: bankTransaction.id,
      },
    });

    const supplierPaymentDetails = await prisma.supplierPaymentDetail.findMany({
      where: {
        paymentId: {
          in: paymentLogs.map((log) => log.paymentId),
        },
      },
    });

    await Promise.all(
      supplierPaymentDetails.map(async (paymentDetail) => {
        const expense = await prisma.purchase.findUnique({
          where: { id: paymentDetail.purchaseId },
        });

        await prisma.purchase.update({
          where: { id: expense.id },
          data: {
            paidAmountETB: Number(expense.paidAmountETB) - Number(paymentDetail.amountPaidETB),
            paidAmountUSD: Number(expense.paidAmountUSD) - Number(paymentDetail.amountPaidUSD),
            paymentStatus:
            Number(expense.paidAmountETB) - Number(paymentDetail.amountPaidETB) === 0
                ? "Incomplete"
                : "Partially Complete",
          },
        });

        // Delete the payment detail entries
        await prisma.supplierPaymentDetail.deleteMany({
          where: { paymentId: paymentDetail.paymentId },
        });

        // Delete the payment log entries
        await prisma.supplierPaymentLog.deleteMany({
          where: { paymentId: paymentDetail.paymentId },
        });

        // Delete the transit payment itself
        await prisma.purchase.delete({ where: { id: paymentDetail.paymentId } });
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

    const foreignCurrency = bankTransaction.foreignCurrency ? bankTransaction.foreignCurrency : 0;

    // Update the balance of subsequent bank transactions by adding the payment amount
    await Promise.all(
      subsequentBankTransactions.map(async (transaction) => {
        await prisma.bankTransaction.update({
          where: { id: transaction.id },
          data: { balance: transaction.balance + bankTransaction.payment,
                  foreignCurrency: transaction.foreignCurrency + foreignCurrency
           },
        });
      })
    );

    await prisma.bankTransaction.delete({ where: { id: bankTransaction.id } });

    return { message: "Transit payment deleted successfully" };
  } catch (error) {
    console.error("Error deleting transit payment:", error);
  }
}

module.exports = {
  createSupplierPayment,
  deleteSupplierPayment
};

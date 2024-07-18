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
  const { bankId,
    date,
    remark,
    credit,
    debit,
    supplierId,
    type,
    chartofAccountId,
    transits,
    payee,
    payment,
    deposit } = req.body;
  try {

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
    //   data:{
    //     bankId:bankId,
    //     payee: supplier ? supplier.name : null,
    //     payment: parseFloat(payment),
    //     deposit: parseFloat(deposit),
    //     type: type,
    //     chartofAccountId: chartofAccountId,
    //     date: new Date(date),
    //     balance: bankTransactions[0]
    //     ? parseFloat(Number(bankTransactions[0].balance)) -
    //       parseFloat(Number(payment)) +
    //       parseFloat(Number(deposit))
    //     : parseFloat(Number(deposit)) - parseFloat(Number(payment)),
    //   }
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
      data:{
        bankTransactionId: bankTransaction.id,
        date: new Date(date),
        remark: remark,
        type: type,
        credit: parseFloat(credit),
        supplierId: supplierId,
      }
    });
    
    // Create second transaction
    const secondTransaction = await prisma.cATransaction.create({
      data:{
        chartofAccountId: chartofAccountId,
        date: new Date(date),
        remark: remark,
        type: type,
        debit: parseFloat(debit),
        supplierId: supplierId,
      }
    });

    await Promise.all(
      transits.map(async (transit) => {
        // Create a new payment record
        const newPayment = await prisma.transit.create({
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

        // Update existing transit record with new paid amount and payment status
        const existingtransit = await prisma.transit.findUnique({
          where: { id: transit.id },
        });
        const newPaidAmount = existingtransit.paidAmount + parseFloat(transit.paidAmount);
        await prisma.transit.update({
          where: { id: transit.id },
          data: {
            paymentStatus: transit.paymentStatus,
            paidAmount: newPaidAmount,
          },
        });

        // Create entry in transitPaymentDetail table
        await prisma.transitPaymentDetail.create({
          data: {
            transitId: transit.id,
            paymentId: newPayment.id,
            amountPaid: parseFloat(transit.paidAmount),
          },
        });

        // Create entries in transitPaymentLog
        const newtransitPaymentLog = await prisma.transitPaymentLog.create({
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
    console.error("Error creating transit payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteTransitPayment(req, res) {
  try {
    const { paymentId } = req.params;

    // Retrieve the payment details, including associated transactions and logs
    const paymentDetails = await prisma.transitPaymentLog.findFirst({
      where: { paymentId: paymentId },
      include: {
        caTransaction1: true,
        caTransaction2: true,
        bankTransaction: true,
      }
    });

    // Extract relevant data
    const { caTransaction1, caTransaction2, bankTransaction } = paymentDetails;

    const paymentLogs = await prisma.transitPaymentLog.findMany({
      where:{
        caTransactionId1: caTransaction1.id,
        caTransactionId2: caTransaction2.id,
        bankTransactionId: bankTransaction.id,
      }
    })

    const transitPaymentDetails = await prisma.transitPaymentDetail.findMany({
      where: {
        paymentId: {
          in: paymentLogs.map((log) => log.paymentId),
        },
      },
    });
    
    await Promise.all(
      transitPaymentDetails.map(async (paymentDetail) => {
        const transitExpense = await prisma.transit.findUnique({
          where: { id: paymentDetail.transitId }
        });
        await prisma.transit.update({
          where: { id: transitExpense.id },
          data: { paidAmount: transitExpense.paidAmount - paymentDetail.amountPaid,
                paymentStatus: transitExpense.paidAmount - paymentDetail.amountPaid === 0 ? "Incomplete" : "Partially Complete"
          }
        });
        
        // Delete the payment detail entries
        await prisma.transitPaymentDetail.deleteMany({
          where: { paymentId: paymentDetail.paymentId }
        });
    
        // Delete the payment log entries
        await prisma.transitPaymentLog.deleteMany({
          where: { paymentId: paymentDetail.paymentId }
        });
    
        // Delete the transit payment itself
        await prisma.transit.delete({ where: { id: paymentDetail.paymentId } });
      })
    );
    
    await prisma.cATransaction.deleteMany({
      where: {
        OR: [
          { id: caTransaction1.id },
          { id: caTransaction2.id }
        ]
      }
    });

    const subsequentBankTransactions = await prisma.bankTransaction.findMany({
      where: {
        bankId: bankTransaction.bankId,
        date: { gt: bankTransaction.date }
      }
    });

    // Update the balance of subsequent bank transactions by adding the payment amount
    await Promise.all(
      subsequentBankTransactions.map(async (transaction) => {
        await prisma.bankTransaction.update({
          where: { id: transaction.id },
          data: { balance: transaction.balance + bankTransaction.payment }
        });
      })
    );
    
    await prisma.bankTransaction.delete({ where: { id: bankTransaction.id } });

    res.json({ message: "Transit payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting transit payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createTransitFee,
  createTransitPayment,
  deleteTransitPayment
};

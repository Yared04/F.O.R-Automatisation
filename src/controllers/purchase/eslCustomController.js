const prisma = require("../../database");

async function createEslCustom(req, res) {
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
    console.error("Error creating esl fee:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createESLPayment(req, res) {
  const { bankId,
    date,
    remark,
    credit,
    debit,
    supplierId,
    type,
    chartofAccountId,
    esls,
    payee,
    payment,
    deposit } = req.body;
  try {
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
      data:{
        bankId:bankId,
        payee: supplier ? supplier.name : null,
        payment: parseFloat(payment),
        deposit: parseFloat(deposit),
        type: type,
        chartofAccountId: chartofAccountId,
        date: new Date(date),
        balance: bankTransactions[0]
        ? parseFloat(Number(bankTransactions[0].balance)) -
          parseFloat(Number(payment)) +
          parseFloat(Number(deposit))
        : parseFloat(Number(deposit)) - parseFloat(Number(payment)),
      }
    });

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
      esls.map(async (esl) => {
        // Create a new payment record
        const newPayment = await prisma.eSL.create({
          data: {
            date: new Date(date),
            paidAmount: parseFloat(esl.paidAmount),
            type: "Payment",
            paymentStatus: "",
            purchase: {
              connect: {
                id: esl.purchase.id,
              },
            },
          },
        });

        // Update existing esl record with new paid amount and payment status
        const existingEsl = await prisma.eSL.findUnique({
          where: { id: esl.id },
        });
        const newPaidAmount = existingEsl.paidAmount + parseFloat(esl.paidAmount);
        await prisma.eSL.update({
          where: { id: esl.id },
          data: {
            paymentStatus: esl.paymentStatus,
            paidAmount: newPaidAmount,
          },
        });

        // Create entry in eslPaymentDetail table
        await prisma.eslPaymentDetail.create({
          data: {
            eslId: esl.id,
            paymentId: newPayment.id,
            amountPaid: parseFloat(esl.paidAmount),
          },
        });

        // Create entries in eslPaymentLog
        const neweslPaymentLog = await prisma.eslPaymentLog.create({
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
    console.error("Error creating esl payment:", error);
    res.status(500).send("Internal Server Error");
  }
}


async function deleteEslPayment(req, res) {
  try {
    const { paymentId } = req.params;

    // Retrieve the payment details, including associated transactions and logs
    const paymentDetails = await prisma.eslPaymentLog.findFirst({
      where: { paymentId: paymentId },
      include: {
        caTransaction1: true,
        caTransaction2: true,
        bankTransaction: true,
      }
    });

    // Extract relevant data
    const { caTransaction1, caTransaction2, bankTransaction } = paymentDetails;

    const paymentLogs = await prisma.eslPaymentLog.findMany({
      where:{
        caTransactionId1: caTransaction1.id,
        caTransactionId2: caTransaction2.id,
        bankTransactionId: bankTransaction.id,
      }
    })

    const eslPaymentDetails = await prisma.eslPaymentDetail.findMany({
      where: {
        paymentId: {
          in: paymentLogs.map((log) => log.paymentId),
        },
      },
    });
    
    await Promise.all(
      eslPaymentDetails.map(async (paymentDetail) => {
        const eslExpense = await prisma.eSL.findUnique({
          where: { id: paymentDetail.eslId }
        });
        await prisma.eSL.update({
          where: { id: eslExpense.id },
          data: { paidAmount: eslExpense.paidAmount - paymentDetail.amountPaid,
                paymentStatus: eslExpense.paidAmount - paymentDetail.amountPaid === 0 ? "Incomplete" : "Partially Complete"
          }
        });
        
        // Delete the payment detail entries
        await prisma.eslPaymentDetail.deleteMany({
          where: { paymentId: paymentDetail.paymentId }
        });
    
        // Delete the payment log entries
        await prisma.eslPaymentLog.deleteMany({
          where: { paymentId: paymentDetail.paymentId }
        });
    
        // Delete the esl payment itself
        await prisma.eSL.delete({ where: { id: paymentDetail.paymentId } });
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
        createdAt: { gt: bankTransaction.createdAt }
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

    res.json({ message: "esl payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting esl payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createEslCustom,
  createESLPayment,
  deleteEslPayment
};

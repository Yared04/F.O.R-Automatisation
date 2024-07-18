const prisma = require("../../database");

async function createCustomerPayment(req, res) {
  const {
    bankId,
    date,
    remark,
    credit,
    debit,
    customerId,
    type,
    chartofAccountId,
    payee,
    foreignCurrency,
    payment,
    deposit,
    exchangeRate,
    sales,
  } = req.body;
  if(sales.length === 0) {
    return res.status(400).json({ message: "There are no sales to pay for." });
  }
  try {
    const bankTransactions = await prisma.bankTransaction.findMany({
      where: { bankId: bankId },
      orderBy: { date: "desc" },
    });

    const customer = await prisma.customer.findUnique({
      where: { id: payee },
    });


    const bankTransaction = await prisma.bankTransaction.create({
      data: {
        bankId: bankId,
        payee: customer.firstName + " " + customer.lastName,
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
      },
    });

    // Create first transaction
    const firstTransaction = await prisma.cATransaction.create({
      data: {
        bankTransactionId: bankTransaction.id,
        date: new Date(date),
        remark: remark,
        type: type,
        debit: parseFloat(debit),
        customerId: customerId,
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
        customerId: customerId,
      },
    });

    await Promise.all(
      sales.map(async (sale) => {
        const newPayment = await prisma.sale.create({
          data: {
            customer: {
              connect: {
                id: sale.customer.id,
              },
            },
            invoiceDate: new Date(date),
            invoiceNumber: sale.invoiceNumber,
            paymentStatus: "",
            paidAmount: sale.paidAmount,
          },
        });

        await prisma.sale.update({
          where: { id: sale.id },
          data: {
            paidAmount: {
              increment: sale.paidAmount,
            },
            paymentStatus: sale.paymentStatus,
          },
        });

        await prisma.customerPaymentDetail.create({
          data: {
            saleId: sale.id,
            paymentId: newPayment.id,
            amountPaid: parseFloat(sale.paidAmount),
          },
        });

        await prisma.customerPaymentLog.create({
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
    console.error("Error creating customer payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteCustomerPayment(paymentId) {
  try {
    // const { paymentId } = req.params;

    // Retrieve the payment details, including associated transactions and logs
    const paymentDetails = await prisma.customerPaymentLog.findFirst({
      where: { paymentId: paymentId },
      include: {
        caTransaction1: true,
        caTransaction2: true,
        bankTransaction: true,
      },
    });

    // Extract relevant data
    const { caTransaction1, caTransaction2, bankTransaction } = paymentDetails;

    const paymentLogs = await prisma.customerPaymentLog.findMany({
      where: {
        caTransactionId1: caTransaction1.id,
        caTransactionId2: caTransaction2.id,
        bankTransactionId: bankTransaction.id,
      },
    });

    const customerPaymentDetails = await prisma.customerPaymentDetail.findMany({
      where: {
        paymentId: {
          in: paymentLogs.map((log) => log.paymentId),
        },
      },
    });

    await Promise.all(
      customerPaymentDetails.map(async (paymentDetail) => {
        const customerExpense = await prisma.sale.findUnique({
          where: { id: paymentDetail.saleId },
        });
        await prisma.sale.update({
          where: { id: customerExpense.id },
          data: {
            paidAmount: customerExpense.paidAmount - paymentDetail.amountPaid,
            paymentStatus:
              customerExpense.paidAmount - paymentDetail.amountPaid === 0
                ? "Incomplete"
                : "Partially Complete",
          },
        });

        // Delete the payment detail entries
        await prisma.customerPaymentDetail.deleteMany({
          where: { paymentId: paymentDetail.paymentId },
        });

        // Delete the payment log entries
        await prisma.customerPaymentLog.deleteMany({
          where: { paymentId: paymentDetail.paymentId },
        });

        // Delete the customer payment itself
        await prisma.sale.delete({
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
        createdAt: { gt: bankTransaction.createdAt },
      },
    });

    // Update the balance of subsequent bank transactions by adding the payment amount
    await Promise.all(
      subsequentBankTransactions.map(async (transaction) => {
        await prisma.bankTransaction.update({
          where: { id: transaction.id },
          data: { balance: transaction.balance - bankTransaction.deposit },
        });
      })
    );

    await prisma.bankTransaction.delete({ where: { id: bankTransaction.id } });

    return { message: "customer payment deleted successfully" };
  } catch (error) {
    console.error("Error deleting customer payment:", error);
  }
}

module.exports = {
  createCustomerPayment,
  deleteCustomerPayment,
};

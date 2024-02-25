const prisma = require("../../database");

async function getCaTransactions(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.CATransaction.count();
    const caTransactions = await prisma.CATransaction.findMany({
      skip: (page - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });
    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));
    res.json({
      items: caTransactions,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving CA Transactions:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createCaTransaction(req, res) {
  try {
    const {
      chartofAccountId,
      date,
      remark,
      purchaseNum,
      invoiceNum,
      declarationNum,
      amount,
      accountDetails,
    } = req.body;
    const createdCaTransaction1 = await prisma.CATransaction.create({
      data: {
        chartofAccountId: chartofAccountId,
        date: new Date(date),
        remark: remark,
        purchaeNum: purchaseNum,
        invoiceNum: invoiceNum,
        declarationNum: declarationNum,
        debit: parseFloat(debit),
        credit: parseFloat(credit),
        accountDetails: accountDetails,
      },
    });
    const createdCaTransaction2 = await prisma.CATransaction.create({
        data: {
            chartofAccountId: chartofAccountId,
            date: new Date(date),
            remark: remark,
            purchaeNum: purchaseNum,
            invoiceNum: invoiceNum,
            declarationNum: declarationNum,
            debit: parseFloat(debit),
            credit: parseFloat(credit),
            accountDetails: accountDetails,
        },
        });

    res.json({createdCaTransaction1, createdCaTransaction2});
  } catch (error) {
    console.error("Error creating CA Transaction:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getCaTransactions,
  createCaTransaction,
};

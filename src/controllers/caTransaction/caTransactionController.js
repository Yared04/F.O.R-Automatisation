const { get, connect } = require("../../app");
const prisma = require("../../database");

async function getCaTransactions(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.CATransaction.count();
    const caTransactions = await prisma.CATransaction.findMany({
      skip: (page - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });
    let caTransactionsList = [];
    caTransactionsList = await Promise.all(
      caTransactions.map(async (caTransaction) => {
        const {
          createdAt,
          updatedAt,
          purchaseId,
          saleId,
          id,
          chartofAccountId,
          ...updatedCaTransaction
        } = caTransaction;

        const chartofAccount = await prisma.chartOfAccount.findUnique({
          where: { id: caTransaction.chartofAccountId },
        });
        updatedCaTransaction.chartofAccount = chartofAccount.name;

        if (caTransaction.purchaseId) {
          let declartionNums = [];
          let purchaseNum;
          const currentPurchase = await prisma.purchase.findUnique({
            where: { id: caTransaction.purchaseId },
          });
          if (currentPurchase) {
            purchaseNum = currentPurchase.number;
            declartionNums = [
              currentPurchase.productPurchases.map(
                (productPurchase) => productPurchase.declarationNumber
              ),
            ];
            updatedCaTransaction = {
              ...caTransaction,
              purchaseNum,
              declartionNums,
            };
          }
        }
        if (caTransaction.saleId) {
          let saleNum;
          const sale = await prisma.sale.findUnique({
            where: { id: caTransaction.saleId },
          });
          if (sale) {
            saleNum = sale.number;
            updatedCaTransaction = {
              ...caTransaction,
              saleNum,
            };
          }
        }
        return updatedCaTransaction;
      })
    );

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));
    res.json({
      items: caTransactionsList,
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

async function createTransaction(
  chartofAccountId1,
  chartofAccountId2,
  date,
  remark,
  debit,
  credit,
  purchaseId,
  saleId,
  accountDetails
) {
  try {
    const createdCaTransaction1 = await prisma.CATransaction.create({
      data: {
        chartofAccount: {
          connect: { id: chartofAccountId1 },
        },
        sale: saleId
          ? {
              connect: { id: saleId },
            }
          : undefined,
        purchase: purchaseId
          ? {
              connect: {
                id: purchaseId,
              },
            }
          : undefined,
        date: new Date(date),
        remark: remark,
        debit: parseFloat(debit),
        credit: parseFloat(credit),
        accountDetails: accountDetails,
      },
    });

    const createdCaTransaction2 = await prisma.CATransaction.create({
      data: {
        chartofAccount: {
          connect: { id: chartofAccountId2 },
        },
        sale: saleId
          ? {
              connect: { id: saleId },
            }
          : undefined,
        purchase: purchaseId
          ? {
              connect: {
                id: purchaseId,
              },
            }
          : undefined,
        date: new Date(date),
        remark: remark,
        debit: parseFloat(credit),
        credit: parseFloat(debit),
        accountDetails: accountDetails,
      },
    });

    return { createdCaTransaction1, createdCaTransaction2 }
  } catch (error) {
    console.error("Error creating CA Transaction:", error);
    return (error, "Internal Server Error");
  }
}

async function createCaTransaction(req, res) {
  try {
    const {
      chartofAccountId1,
      chartofAccountId2,
      date,
      remark,
      debit,
      credit,
      accountDetails,
    } = req.body;
    await createTransaction(
      chartofAccountId1,
      chartofAccountId2,
      date,
      remark,
      debit,
      credit,
      null, 
      null,
      accountDetails
    );
  } catch (error) {
    console.error("Error creating CA Transaction:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getCaTransactionById(req, res) {
  try {
    const caTransactionId = req.params.id;
    const caTransaction = await prisma.CATransaction.findUnique({
      where: { id: caTransactionId },
    });
    if (!caTransaction) {
      return res.status(404).send("CA Transaction not found");
    }
    const {
      createdAt,
      updatedAt,
      purchaseId,
      saleId,
      id,
      chartofAccountId,
      ...updatedCaTransaction
    } = caTransaction;

    const chartofAccount = await prisma.chartOfAccount.findUnique({
      where: { id: caTransaction.chartofAccountId },
    });
    updatedCaTransaction.chartofAccount = chartofAccount.name;

    if (caTransaction.purchaseId) {
      let declartionNums = [];
      let purchaseNum;
      const currentPurchase = await prisma.purchase.findUnique({
        where: { id: caTransaction.purchaseId },
      });
      if (currentPurchase) {
        purchaseNum = currentPurchase.number;
        declartionNums = [
          currentPurchase.productPurchases.map(
            (productPurchase) => productPurchase.declarationNumber
          ),
        ];
        updatedCaTransaction = {
          ...caTransaction,
          purchaseNum,
          declartionNums,
        };
      }
    }
    if (caTransaction.saleId) {
      let saleNum;
      const sale = await prisma.sale.findUnique({
        where: { id: caTransaction.saleId },
      });
      if (sale) {
        saleNum = sale.number;
        updatedCaTransaction = {
          ...caTransaction,
          saleNum,
        };
      }
    }

    res.json(updatedCaTransaction);
  } catch (error) {
    console.error("Error retrieving CA Transaction:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getCaTransactions,
  createCaTransaction,
  getCaTransactionById,
  createTransaction,
};

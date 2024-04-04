const { parse } = require("path");
const prisma = require("../../database");

async function getCaTransactions(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.CATransaction.count();
    const caTransactions = await prisma.CATransaction.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        supplier: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        productPurchase: {
          select: {
            product: true,
          },
        },
        saleDetail: {
          select: {
            product: true,
          },
        },
        bankTransaction: {
          select: {
            bank: {
              select: {
                name: true,
              },
            },
          },
        },
        purchase: {
          select: {
            number: true,
          },
        },
        sale: {
          select: {
            invoiceNumber: true,
          },
        },
        chartofAccount: {
          select: {
            name: true,
          },
        },
        productDeclaration: {
          select: {
            product: true,
          },
        },
      },
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

async function createBankTransaction(req, res) {
  const {
    bankId,
    payee,
    foreignCurrency,
    payment,
    deposit,
    type,
    chartofAccountId,
    exchangeRate,
  } = req.body;
  try {
    const bankTransactions = await prisma.bankTransaction.findMany({
      where: { bankId: bankId },
      orderBy: { createdAt: "desc" },
    });

    const supplier = payee
      ? await prisma.supplier.findUnique({
          where: { id: payee },
        })
      : null;
    const createdBankTransaction = await prisma.bankTransaction.create({
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
      },
    });

    res.json(createdBankTransaction);
  } catch (error) {
    console.error("Error creating bank transaction:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createSupplierPayment(req, res) {
  try {
    const { date, purchases } = req.body;
    await Promise.all(
      purchases.map(async (purchase) => {
        await prisma.purchase.create({
          data: {
            supplier: {
              connect: {
                id: purchase.supplier.id,
              },
            },
            date: new Date(date),
            number: purchase.number,
            exchangeRate: purchase.exchangeRate,
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
      })
    );
    res.json({ message: "Payment successful" });
  } catch (error) {
    console.error("Error creating supplier payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createCustomerPayment(req, res) {
  try {
    const { date, sales } = req.body;
    await Promise.all(
      sales.map(async (sale) => {
        await prisma.sale.create({
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
      })
    );
    res.json({ message: "Payment successful" });
  } catch (error) {
    console.error("Error creating customer payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createTransaction(
  chartofAccountId,
  bankId,
  date,
  remark,
  type,
  debit,
  credit,
  purchaseId,
  productPurchaseId,
  saleId,
  saleDetailId,
  supplierId,
  customerId,
  exchangeRate,
  USDAmount,
  accountPayableRecievableDetail,
  number,
  productDeclarationId
) {
  try {
    let createdCaTransaction;
    const bankTransactions =
      bankId &&
      (await prisma.bankTransaction.findMany({
        where: { bankId: bankId },
        orderBy: { createdAt: "desc" },
      }));
    createdCaTransaction = await prisma.cATransaction.create({
      data: {
        chartofAccount: chartofAccountId
          ? {
              connect: { id: chartofAccountId },
            }
          : undefined,
        bankTransaction:
          bankTransactions && bankTransactions[0]
            ? { connect: { id: bankTransactions[0].id } }
            : undefined,
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
        productPurchase: productPurchaseId
          ? {
              connect: {
                id: productPurchaseId,
              },
            }
          : undefined,
        productDeclaration: productDeclarationId
          ? {
              connect: {
                id: productDeclarationId,
              },
            }
          : undefined,
        saleDetail: saleDetailId
          ? {
              connect: {
                id: saleDetailId,
              },
            }
          : undefined,
        supplier: supplierId
          ? {
              connect: {
                id: supplierId,
              },
            }
          : undefined,
        customer: customerId
          ? {
              connect: {
                id: customerId,
              },
            }
          : undefined,
        exchangeRate: exchangeRate,
        USDAmount: USDAmount,
        type: type,
        date: new Date(date),
        remark: remark,
        debit: parseFloat(debit),
        credit: parseFloat(credit),
        accountPayableRecievableDetail: accountPayableRecievableDetail,
        number: parseFloat(number),
      },
      include: {
        chartofAccount: true,
        supplier: true,
        customer: true,
        bankTransaction: true,
        purchase: true,
        sale: true,
        productPurchase: true,
        saleDetail: true,
      },
    });

    return createdCaTransaction;
  } catch (error) {
    console.error("Error creating CA Transaction:", error);
    throw new Error("Internal Server Error");
  }
}

async function createCaTransaction(req, res) {
  try {
    const {
      chartofAccountId,
      bankId,
      date,
      remark,
      type,
      debit,
      credit,
      purchaseId,
      productPurchaseId,
      saleId,
      saleDetailId,
      supplierId,
      customerId,
      exchangeRate,
      USDAmount,
      accountPayableRecievableDetail,
      number,
      productDeclarationId
    } = req.body;
    const transaction = await createTransaction(
      chartofAccountId,
      bankId,
      date,
      remark,
      type,
      debit,
      credit,
      purchaseId,
      productPurchaseId,
      saleId,
      saleDetailId,
      supplierId,
      customerId,
      exchangeRate,
      USDAmount,
      accountPayableRecievableDetail,
      number,
      productDeclarationId
    );

    res.json(transaction);
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
      chartofAccountId,
      ...updatedCaTransaction
    } = caTransaction;
    let updatedCATransaction = updatedCaTransaction;

    const chartofAccount = await prisma.chartOfAccount.findUnique({
      where: { id: caTransaction.chartofAccountId },
    });
    updatedCATransaction.chartofAccount = chartofAccount.name;

    if (caTransaction.purchaseId) {
      let declarationNumbers = [];
      let purchaseNumber;
      const currentPurchase = await prisma.purchase.findUnique({
        where: { id: caTransaction.purchaseId },
      });
      const currentProductPurchases = await prisma.productPurchase.findMany({
        where: { purchaseId: caTransaction.purchaseId },
        include: { declaration: true },
      });
      if (currentProductPurchases) {
        purchaseNumber = currentPurchase.number;
        declarationNumbers = [
          currentProductPurchases.map(
            (productPurchase) => productPurchase.declaration.number
          ),
        ];
        updatedCATransaction = {
          ...updatedCATransaction,
          purchaseNumber,
          declarationNumbers,
        };
      }
    }

    if (caTransaction.saleId) {
      let saleNum;
      const sale = await prisma.sale.findUnique({
        where: { id: caTransaction.saleId },
      });
      if (sale) {
        saleNum = sale.invoiceNumber;
        updatedCATransaction = {
          ...updatedCATransaction,
          invoiceNumber: saleNum,
        };
      }
    }

    res.json(updatedCATransaction);
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
  createSupplierPayment,
  createBankTransaction,
  createCustomerPayment,
};

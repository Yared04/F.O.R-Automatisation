const { parse } = require("path");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");
const prisma = require("../../database");

async function getCaTransactions(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.CATransaction.count();
    const caTransactions = await prisma.CATransaction.findMany({
      orderBy: [
        {
          date: "desc",
        },
        {
          supplier: {
            name: "asc",
          },
        },

        {
          createdAt: "desc",
        },
      ],
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

async function getCaTransactionsByMonth(req, res) {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).send("Month and year are required");
    }
    const caTransactions = await prisma.CATransaction.findMany({
      where: {
        date: {
          gte: new Date(`${year}-${month}-01`),
          lt: new Date(`${year}-${month}-30`),
        },
      },
    });

    res.json({
      items: caTransactions,
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
    date,
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
        date: new Date(date),
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
  productDeclarationId,
  declarationId
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
        declaration: declarationId
          ? {
              connect: {
                id: declarationId,
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
      productDeclarationId,
      declarationId,
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
      productDeclarationId,
      declarationId
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

async function generateCaTransactionSummary(req, res) {
  try {
    const { startDate, endDate } = req.query;
    let transactionFilter = {};

    if (startDate && endDate) {
      transactionFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    const caTransactions = await prisma.CATransaction.findMany({
      where: transactionFilter,
      orderBy: [
        {
          date: "desc",
        },
        {
          supplier: {
            name: "asc",
          },
        },

        {
          createdAt: "desc",
        },
      ],
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
    });

    // send pdf

    const pdfContent = await generateCaTransactionPDFContent(
      caTransactions,
      startDate,
      endDate
    );

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="transaction-with-splits.pdf"'
    );

    // Stream PDF content to the client
    const stream = new Readable();
    stream.push(pdfContent);
    stream.push(null); // Indicates the end of the stream
    stream.pipe(res);
  } catch (error) {
    console.error("Error generating CA Transaction summary:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function generateCaTransactionPDFContent(
  caTransactions,
  startDate,
  endDate
) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    // Buffer PDF content
    doc.on("data", (buffer) => buffers.push(buffer));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    let pageCount = 0;
    const handleTimeSpan = () => {
      if (startDate && endDate) {
        return `Transactions from ${formatDateUTCtoMMDDYYYY(
          new Date(startDate)
        )} to ${formatDateUTCtoMMDDYYYY(new Date(endDate))}`;
      }
      return "All Dates";
    };
    // add table headers
    let xOffset = 10;
    let yOffset = 190;
    const addHeaders = () => {
      ++pageCount;
      if (pageCount > 1) {
        doc.addPage();
      }
      xOffset = 10;
      yOffset = 190;
      doc
        .fontSize(10)
        .text("Transactions with split", { align: "center" })
        .moveDown();
      doc.fontSize(8).text(handleTimeSpan(), { align: "center" }).moveDown();
      doc.fontSize(5);
      columnTitlesWithOffset.forEach((title) => {
        doc.text(title[0], xOffset, 150);
        xOffset += title[1];
      });
      doc.lineWidth(0.5); // Set line weight to 2 (adjust as needed)
      doc.moveTo(10, 145).lineTo(600, 145).stroke(); // Line above the first row
      doc.moveTo(10, 165).lineTo(600, 165).stroke(); // Line above the first row
      xOffset = 10;
    };
    const columnTitlesWithOffset = [
      ["DATE", 40],
      ["TRANSACTION TYPE", 65],
      ["NO.", 15],
      ["POSTING", 30],
      ["NAME", 60],
      ["MEMO/DESCRIPTION", 70],
      ["DEBIT", 40],
      ["CREDIT", 40],
      ["PRODUCT/SERVICE", 70],
      ["CUSTOMER", 60],
      ["SUPPLIER", 40],
      ["ACCOUNT", 50],
    ];
    addHeaders();
    caTransactions.forEach((transaction) => {
      if (yOffset > 680) {
        addHeaders();
      }
      doc
        .font("Helvetica")
        .text(
          formatDateUTCtoMMDDYYYY(new Date(transaction.date)),
          xOffset,
          yOffset
        );
      xOffset += columnTitlesWithOffset[0][1];
      doc.text(transaction.type, xOffset, yOffset);
      xOffset += columnTitlesWithOffset[1][1];
      doc.text(transaction.number, xOffset, yOffset);
      xOffset += columnTitlesWithOffset[2][1];
      doc.text(transaction.posting, xOffset, yOffset);
      xOffset += columnTitlesWithOffset[3][1];
      doc.text(transaction.name, xOffset, yOffset);
      xOffset += columnTitlesWithOffset[4][1];
      doc.text(transaction.remark, xOffset, yOffset);
      xOffset += columnTitlesWithOffset[5][1];
      doc.text(transaction.debit, xOffset, yOffset);
      xOffset += columnTitlesWithOffset[6][1];
      doc.text(transaction.credit, xOffset, yOffset);
      xOffset += columnTitlesWithOffset[7][1];
      doc.text(transaction.productPurchase?.product.name, xOffset, yOffset);
      xOffset += columnTitlesWithOffset[8][1];
      doc.text(
        transaction.customer
          ? transaction.customer.firstName + " " + transaction.customer.lastName
          : "",
        xOffset,
        yOffset
      );
      xOffset += columnTitlesWithOffset[9][1];
      doc.text(
        transaction.supplier ? transaction.supplier.name : "",
        xOffset,
        yOffset
      );
      xOffset += columnTitlesWithOffset[10][1];
      doc.text(transaction.chartofAccount.name, xOffset, yOffset);
      xOffset = 10;
      yOffset += 20;
    });

    doc
      .moveTo(10, yOffset + 10)
      .lineTo(600, yOffset + 10)
      .stroke(); // Line below the last row

    doc.end();
  });
}

function formatDateUTCtoMMDDYYYY(utcDate) {
  const date = new Date(utcDate);
  const mm = date.getUTCMonth() + 1; // getMonth() is zero-based
  const dd = date.getUTCDate();
  const yyyy = date.getUTCFullYear();

  return `${mm.toString().padStart(2, "0")}/${dd
    .toString()
    .padStart(2, "0")}/${yyyy}`;
}

async function createJournalEntry(req, res) {
  try {
    const {
      bankId,
      chartofAccountId,
      date,
      debit,
      credit,
      remark,
      type,
      accountPayableRecievableDetail,
      payment,
      deposit,
    } = req.body;

    const bankTransactions = await prisma.bankTransaction.findMany({
      where: { bankId: bankId },
      orderBy: { createdAt: "desc" },
    });

    const bankTransaction = await prisma.bankTransaction.create({
      data: {
        bankId: bankId,
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

    const highest = await prisma.cATransaction.findFirst({
      where: {
        type: "Journal Entry",
      },
      orderBy: {
        number: "desc", // Order by CA transaction number in descending order
      },
      take: 1, // Take only the first result
    });

    const journalNumber = highest ? highest.number + 1 : 1;

    const firstTransaction = await prisma.cATransaction.create({
      data: {
        bankTransactionId: bankTransaction.id,
        date: new Date(date),
        remark: remark,
        type: type,
        credit: parseFloat(credit),
        accountPayableRecievableDetail: accountPayableRecievableDetail,
        number: journalNumber,
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
    });

    const secondTransaction = await prisma.cATransaction.create({
      data: {
        chartofAccountId: chartofAccountId,
        date: new Date(date),
        remark: remark,
        type: type,
        debit: parseFloat(debit),
        accountPayableRecievableDetail: accountPayableRecievableDetail,
        number: journalNumber,
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
    });

    return res.status(200).json({ firstTransaction, secondTransaction });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteJournalEntry(req, res) {
  try {
    const id = req.params.id;

    const journalEntry = await prisma.cATransaction.findUnique({
      where: {
        id: id,
      },
    });

    const journalWithBankTransaction = await prisma.cATransaction.findFirst({
      where: {
        number: journalEntry.number,
        type: "Journal Entry",
        bankTransactionId: { not: null },
      },
    });

    const bankTransaction = await prisma.bankTransaction.findUnique({
      where: {
        id: journalWithBankTransaction.bankTransactionId,
      },
    });

    const latestBankTransaction = await prisma.bankTransaction.findFirst({
      where: {
        bankId: bankTransaction.bankId,
        type: "Journal Entry",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate new balance
    const newBalance =
      latestBankTransaction.balance -
      bankTransaction.deposit +
      bankTransaction.payment;

    // Update latest bank transaction balance
    await prisma.bankTransaction.update({
      where: { id: latestBankTransaction.id },
      data: { balance: newBalance },
    });

    const deletedEntries = await prisma.cATransaction.findMany({
      where: {
        number: journalEntry.number,
        type: "Journal Entry",
      },
    });

    // Delete journal entries and associated bank transaction
    await prisma.cATransaction.deleteMany({
      where: {
        number: journalEntry.number,
        type: "Journal Entry",
      },
    });

    await prisma.bankTransaction.delete({
      where: {
        id: bankTransaction.id,
      },
    });
    res.json(deletedEntries);
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getCaTransactions,
  createCaTransaction,
  getCaTransactionById,
  createTransaction,
  createSupplierPayment,
  createBankTransaction,
  generateCaTransactionSummary,
  createJournalEntry,
  deleteJournalEntry,
  getCaTransactionsByMonth,
};

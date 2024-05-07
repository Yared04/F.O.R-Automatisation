const prisma = require("../../database");
const {
  createTransaction,
} = require("../caTransaction/caTransactionController");

async function getDeclarations(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;

    if (page && pageSize) {
      const totalCount = await prisma.declaration.count();

      const declarations = await prisma.declaration.findMany({
        select: {
          id: true,
          number: true,
          date: true,
          paidAmount: true,
        },
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
      });

      const declarationsWithProducts = await Promise.all(
        declarations.map(async (declaration) => {
          const declarationProducts = await prisma.productDeclaration.findMany({
            where: {
              declarationId: declaration.id,
            },
            select: {
              declarationQuantity: true,
              totalIncomeTax: true,
              unitIncomeTax: true,
              purchasedQuantity: true,
              declarationBalance: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  unitOfMeasurement: true,
                },
              },
            },
          });
          return { ...declaration, declarationProducts };
        })
      );

      const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));
      return res.json({
        items: declarationsWithProducts,
        totalCount: totalCount,
        pageSize: parseInt(pageSize, 10),
        currentPage: parseInt(page, 10),
        totalPages: totalPages,
      });
    } else {
      // Fetch all declarations without pagination
      const allDeclarations = await prisma.declaration.findMany({
        select: {
          id: true,
          number: true,
          date: true,
          paidAmount: true,
        },
      });

      const allDeclarationsWithProducts = await Promise.all(
        allDeclarations.map(async (declaration) => {
          const declarationProducts = await prisma.productDeclaration.findMany({
            where: {
              declarationId: declaration.id,
            },
            select: {
              declarationQuantity: true,
              totalIncomeTax: true,
              unitIncomeTax: true,
              purchasedQuantity: true,
              declarationBalance: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  unitOfMeasurement: true,
                },
              },
            },
          });
          return { ...declaration, declarationProducts };
        })
      );

      return res.json({
        items: allDeclarationsWithProducts,
        totalCount: allDeclarations.length,
      });
    }
  } catch (error) {
    console.error("Error retrieving declarations:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createDeclaration(req, res) {
  try {
    const { number, date, paidAmount, declarationProducts } = req.body;
    const createdDeclaration = await prisma.declaration.create({
      data: {
        number,
        date: new Date(date),
        paidAmount,
      },
    });

    let chartOfAccounts = [];
    let suppliers = [];
    try {
      chartOfAccounts = await prisma.chartOfAccount.findMany({
        select: { id: true, name: true },
      });

      suppliers = await prisma.supplier.findMany({
        select: { id: true, name: true },
      });
    } catch {
      throw new Error("Error fetching Chart of Accounts");
    }

    const supplier = suppliers.find(
      (supplier) => supplier.name === "Custom Taxes"
    );

    const accountsPayable = chartOfAccounts.find(
      (account) => account.name === "Accounts Payable (A/P) - ETB"
    );

    const incomeTaxExpense = chartOfAccounts.find(
      (account) => account.name === "Income tax expense"
    );

    let totalAmount = 0;
    const createdDeclarationProducts = await Promise.all(
      declarationProducts.map(async (dp) => {
        let createdDeclarationProduct = await prisma.productDeclaration.create({
          data: {
            declarationQuantity: parseInt(dp.declarationQuantity),
            totalIncomeTax: parseInt(dp.totalIncomeTax),
            unitIncomeTax: dp.totalIncomeTax / dp.declarationQuantity,
            purchasedQuantity: 0,
            product: { connect: { id: dp.productId } },
            declaration: { connect: { id: createdDeclaration.id } },
          },
        });

        totalAmount += createdDeclarationProduct.totalIncomeTax;

        await createTransaction(
          incomeTaxExpense.id,
          null,
          new Date(date),
          "",
          "Bill",
          dp.totalIncomeTax,
          null,
          null,
          null,
          null,
          null,
          supplier.id,
          null,
          null,
          null,
          null,
          null,
          createdDeclarationProduct.id
        );

        return {
          productId: dp.productId,
          declarationQuantity: createdDeclarationProduct.declarationQuantity,
          totalIncomeTax: createdDeclarationProduct.totalIncomeTax,
          purchasedQuantity: createdDeclarationProduct.purchasedQuantity,
          declarationBalance: createdDeclarationProduct.declarationBalance,
          unitIncomeTax: createdDeclarationProduct.unitIncomeTax,
        };
      })
    );
    if (declarationProducts.length > 0) {
      await createTransaction(
        accountsPayable.id,
        null,
        new Date(date),
        number,
        "Bill",
        null,
        totalAmount,
        null,
        null,
        null,
        null,
        supplier.id,
        null,
        null,
        null,
        null,
        null,
        null,
        createdDeclaration.id
      );
    }
    const declarationData = {
      id: createdDeclaration.id.toString(),
      number,
      date,
      declarationProducts: createdDeclarationProducts,
    };

    res.json(declarationData);
  } catch (error) {
    console.error("Error creating declaration:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateDeclaration(req, res) {
  try {
    const { id } = req.params; // Extract the declaration ID from request parameters
    const { number, date } = req.body; // Extract updated data from request body

    const payment = await prisma.declaration.findUnique({
      where:{
        id: id
      }
    })

    if (payment.paidAmount !== 0 ) {
      return res.status(400).json({
        error: "You can not update declaration number and date of custom tax payment.",
      });
    }

    const existingDeclaration = await prisma.declaration.findFirst({
      where: {
        number: number,
        paidAmount: 0
      }
    });

    if (existingDeclaration && existingDeclaration.id !== id) {
      return res.status(400).json({
        error: "There is already a declaration by this declaration number",
      });
    }

    // Update the Declaration
    const updatedDeclaration = await prisma.declaration.update({
      where: { id: id }, // Convert id to integer if needed
      data: {
        number,
        date: new Date(date),
      },
    });

    res.json(updatedDeclaration);
  } catch (error) {
    console.error("Error updating declaration:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteDeclaration(req, res) {
  try {
    const { id } = req.params; // Extract the declaration ID from request parameters

    const hasAssociatedPurchases = await prisma.productPurchase.findFirst({
      where: {
        declarationId: id,
      },
    });

    if (hasAssociatedPurchases) {
      // Return a specific message indicating associated purchases exist
      return res.status(400).json({
        error:
          "You cannot delete this declaration. Associated purchases exist.",
      });
    }

    const productDeclarations = await prisma.productDeclaration.findMany({
      where: {
        declarationId: id,
      }
    })

    productDeclarations.forEach(async element => {
      await prisma.cATransaction.deleteMany({
        where: {productDeclarationId: element.id}
      })
    });

    // Delete the associated product declarations
    await prisma.productDeclaration.deleteMany({
      where: {
        declarationId: id,
      },
    });

    // Delete the declaration
    // const deletedDeclaration = await prisma.declaration.delete({
    //   where: {
    //     id: id,
    //   },
    // });

    
    const paymentDetails = await prisma.customTaxPaymentLog.findFirst({
      where: { paymentId: id },
      include: {
        caTransaction1: true,
        caTransaction2: true,
        bankTransaction: true,
      }
    });
    if(paymentDetails){
    const { caTransaction1, caTransaction2, bankTransaction } = paymentDetails;

    await prisma.customTaxPaymentLog.deleteMany({
          where: { paymentId: id }
        });
        
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

    await Promise.all(
      subsequentBankTransactions.map(async (transaction) => {
        await prisma.bankTransaction.update({
          where: { id: transaction.id },
          data: { balance: transaction.balance + bankTransaction.payment }
        });
      })
    );
    
    await prisma.bankTransaction.delete({ where: { id: bankTransaction.id } });
  }

  const deletedDeclaration = await prisma.declaration.delete({ where: { id: id } });

    res.json(deletedDeclaration);
  } catch (error) {
    console.error("Error deleting declaration:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getDeclarationById(req, res) {
  try {
    const { id } = req.params; // Extract the declaration ID from request parameters
    const declaration = await prisma.declaration.findUnique({
      where: {
        id: id, // Convert id to integer if needed
      },
      select: {
        id: true,
        number: true,
        date: true,
      },
    });

    if (!declaration) {
      return res.status(404).json({ error: "Declaration not found" });
    }

    // Retrieve associated products for the declaration
    const declarationProducts = await prisma.productDeclaration.findMany({
      where: {
        declarationId: id, // Convert id to integer if needed
      },
      select: {
        id: true,
        declarationQuantity: true,
        totalIncomeTax: true,
        unitIncomeTax: true,
        purchasedQuantity: true,
        declarationBalance: true,
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unitOfMeasurement: true,
          },
        },
      },
    });

    // Combine declaration data with associated products
    const declarationWithProducts = { ...declaration, declarationProducts };

    res.json(declarationWithProducts);
  } catch (error) {
    console.error("Error retrieving declaration by ID:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateProductDeclaration(req, res) {
  try {
    const { id } = req.params; // Extract the productDeclaration ID from request parameters
    const { declarationQuantity, totalIncomeTax, productId } = req.body; // Extract updated data from request body

    // Fetch the existing product declaration
    const existingProductDeclaration =
      await prisma.productDeclaration.findUnique({
        where: { id: id },
      });

    if (!existingProductDeclaration) {
      return res.status(404).json({ error: "Product declaration not found" });
    }

    // Check if purchased quantity is 0
    if (existingProductDeclaration.purchasedQuantity !== 0) {
      return res.status(400).json({
        error:
          "Product declaration cannot be updated because purchased quantity is not 0",
      });
    }

    // Calculate unitIncomeTax based on totalIncomeTax and declarationQuantity
    const unitIncomeTax =
      parseFloat(totalIncomeTax) / parseFloat(declarationQuantity);

    // Update the ProductDeclaration
    const updatedProductDeclaration = await prisma.productDeclaration.update({
      where: { id: id },
      data: {
        declarationQuantity: parseInt(declarationQuantity),
        totalIncomeTax: parseInt(totalIncomeTax),
        unitIncomeTax: unitIncomeTax,
        product: { connect: { id: productId } }, // Assuming product object has an 'id' field
      },
      include: {
        product: true,
      },
    });


    let chartOfAccounts = [];
    let suppliers = [];
    try {
      chartOfAccounts = await prisma.chartOfAccount.findMany({
        select: { id: true, name: true },
      });

      suppliers = await prisma.supplier.findMany({
        select: { id: true, name: true },
      });
    } catch {
      throw new Error("Error fetching Chart of Accounts");
    }

    const accountsPayable = chartOfAccounts.find(
      (account) => account.name === "Accounts Payable (A/P) - ETB"
    );

    const incomeTaxExpense = chartOfAccounts.find(
      (account) => account.name === "Income tax expense"
    );

    const productDeclarations = await prisma.productDeclaration.findMany({
      where: {declarationId: updatedProductDeclaration.declarationId}
    })

    const totalTax = productDeclarations.reduce((total, declaration) => {
      return total + declaration.totalIncomeTax;
    }, 0); 


    const existingDebitTransaction = await prisma.cATransaction.findFirst({
      where: {
        AND: [
          { productDeclarationId: updatedProductDeclaration.id },
          { chartofAccountId: incomeTaxExpense.id }
        ]
      }
    });

    // If a matching record is found, update it
    if (existingDebitTransaction) {
      await prisma.cATransaction.update({
        where: { id: existingDebitTransaction.id }, // Specify the ID of the found record
        data: {
          debit: updatedProductDeclaration.totalIncomeTax,
        }
      });
    }

   const existingTransaction = await prisma.cATransaction.findFirst({
      where:{
        AND: [
       { declarationId: updatedProductDeclaration.declarationId},
        {chartofAccountId: accountsPayable.id},]
      }
    })

    if(existingTransaction){
      await prisma.cATransaction.update({
        where: {
          id: existingTransaction.id
        }, data:{
          credit: totalTax,
        }
      })
    }

    res.json(updatedProductDeclaration);
  } catch (error) {
    console.error("Error updating product declaration:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteProductDeclaration(req, res) {
  try {
    const { id } = req.params; // Extract the productDeclaration ID from request parameters

    // Fetch the existing product declaration
    const existingProductDeclaration =
      await prisma.productDeclaration.findUnique({
        where: { id: id },
      });

    if (!existingProductDeclaration) {
      return res.status(404).json({ error: "Product declaration not found" });
    }

    // Check if purchased quantity is 0
    if (existingProductDeclaration.purchasedQuantity !== 0) {
      return res.status(400).json({
        error:
          "Product declaration cannot be deleted because purchased quantity is not 0",
      });
    }

    const declarationProducts = await prisma.productDeclaration.findMany({
      where: { declarationId: existingProductDeclaration.declarationId },
    });

    if (declarationProducts.length == 1) {
      return res.status(400).json({
        error: "There should atleast be one product in a declaration.",
      });
    }

    let chartOfAccounts = [];
    let suppliers = [];
    try {
      chartOfAccounts = await prisma.chartOfAccount.findMany({
        select: { id: true, name: true },
      });

      suppliers = await prisma.supplier.findMany({
        select: { id: true, name: true },
      });
    } catch {
      throw new Error("Error fetching Chart of Accounts");
    }

    const accountsPayable = chartOfAccounts.find(
      (account) => account.name === "Accounts Payable (A/P) - ETB"
    );


   const existingTransaction = await prisma.cATransaction.findFirst({
      where:{
        AND: [
       { declarationId: existingProductDeclaration.declarationId},
        {chartofAccountId: accountsPayable.id},]
      }
    })

    if(existingTransaction){
      await prisma.cATransaction.update({
        where: {
          id: existingTransaction.id
        }, data:{
          credit: (existingTransaction.credit - existingProductDeclaration.totalIncomeTax),
        }
      })
    }

    await prisma.cATransaction.deleteMany({
      where: {productDeclarationId: id}
    })
    // Delete the ProductDeclaration
    const deletedProductDeclaration = await prisma.productDeclaration.delete({
      where: { id: id },
    });

    res.json(deletedProductDeclaration);
  } catch (error) {
    console.error("Error deleting product declaration:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createProductDeclaration(req, res) {
  try {
    const { declarationQuantity, totalIncomeTax, productId, declarationId } =
      req.body; // Extract updated data from request body

    // Calculate unitIncomeTax based on totalIncomeTax and declarationQuantity
    const unitIncomeTax =
      parseFloat(totalIncomeTax) / parseFloat(declarationQuantity);

    // Update the ProductDeclaration
    const productDeclaration = await prisma.productDeclaration.create({
      data: {
        declarationQuantity: parseInt(declarationQuantity),
        totalIncomeTax: parseInt(totalIncomeTax),
        unitIncomeTax: unitIncomeTax,
        purchasedQuantity: 0,
        product: { connect: { id: productId } },
        declaration: { connect: { id: declarationId } },
      },
      include: {
        product: true,
        declaration: true
      },
    });

    let chartOfAccounts = [];
    let suppliers = [];
    try {
      chartOfAccounts = await prisma.chartOfAccount.findMany({
        select: { id: true, name: true },
      });

      suppliers = await prisma.supplier.findMany({
        select: { id: true, name: true },
      });
    } catch {
      throw new Error("Error fetching Chart of Accounts");
    }

    const supplier = suppliers.find(
      (supplier) => supplier.name === "CUSTOM INCOME TAX"
    );

    const accountsPayable = chartOfAccounts.find(
      (account) => account.name === "Accounts Payable (A/P) - ETB"
    );

    const incomeTaxExpense = chartOfAccounts.find(
      (account) => account.name === "Income tax expense"
    );

    const productDeclarations = await prisma.productDeclaration.findMany({
      where: {declarationId: declarationId}
    })

    const totalTax = productDeclarations.reduce((total, declaration) => {
      return total + declaration.totalIncomeTax;
    }, 0); 

    await createTransaction(
      incomeTaxExpense.id,
      null,
      new Date(productDeclaration.declaration.date),
      "",
      "Bill",
      productDeclaration.totalIncomeTax,
      null,
      null,
      null,
      null,
      null,
      supplier.id,
      null,
      null,
      null,
      null,
      null,
      productDeclaration.id,
    );


    const existingTransaction = await prisma.cATransaction.findFirst({
      where: {
        AND: [
          { declarationId: productDeclaration.declarationId},
          { chartofAccountId: accountsPayable.id}
        ]
      }
    })

    if(existingTransaction){
      await prisma.cATransaction.update({
        where:{
          id: existingTransaction.id
        }, data:{
          credit: totalTax,
        }
      })
    }

    res.json(productDeclaration);
  } catch (error) {
    console.error("Error creating product declaration:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createCustomTaxPayment(req, res){

const {
  bankId,
  date,
  remark,
  credit,
  debit,
  supplierId,
  type,
  chartofAccountId,
  number,
  paidAmount,
  payee,
  payment,
  deposit
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

    const createdDeclaration = await prisma.declaration.create({
      data: {
        number,
        date: new Date(date),
        paidAmount,
      },
    });    

        const newCustomPaymentLog = await prisma.customTaxPaymentLog.create({
          data: {
            paymentId: createdDeclaration.id,
            caTransactionId1: firstTransaction.id, // Use the ID of the first transaction
            caTransactionId2: secondTransaction.id, // Use the ID of the second transaction
            bankTransactionId: bankTransaction.id,
          },
        });

    res.json(createdDeclaration);
  } catch (error) {
    console.error("Error creating custom tax payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteCustomTaxPayment(req, res) {
  try {
    const { paymentId } = req.params;

    const paymentDetails = await prisma.customTaxPaymentLog.findFirst({
      where: { paymentId: paymentId },
      include: {
        caTransaction1: true,
        caTransaction2: true,
        bankTransaction: true,
      }
    });
    
    const { caTransaction1, caTransaction2, bankTransaction } = paymentDetails;

    await prisma.customTaxPaymentLog.deleteMany({
          where: { paymentId: paymentId }
        });
    
    const deletedDeclaration = await prisma.declaration.delete({ where: { id: paymentId } });
    
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

    await Promise.all(
      subsequentBankTransactions.map(async (transaction) => {
        await prisma.bankTransaction.update({
          where: { id: transaction.id },
          data: { balance: transaction.balance + bankTransaction.payment }
        });
      })
    );
    
    await prisma.bankTransaction.delete({ where: { id: bankTransaction.id } });

    res.json(deletedDeclaration);
  } catch (error) {
    console.error("Error deleting transit payment:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getDeclarationById,
  updateDeclaration,
  getDeclarations,
  createDeclaration,
  deleteDeclaration,
  updateProductDeclaration,
  deleteProductDeclaration,
  createProductDeclaration,
  createCustomTaxPayment,
  deleteCustomTaxPayment
};

const prisma = require("../../database");
const {
  createTransaction,
} = require("../caTransaction/caTransactionController");

async function getSales(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.sale.count();

    const sales = await prisma.Sale.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        customer: true,
      },
      skip: (page - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: sales,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving Sales:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createSale(req, res) {
  try {
    const { invoiceNumber, invoiceDate, customerId, products } = req.body;
    let createdSale = null;
    let saleId = null;

    try {
      for (const product of products) {
        let availableProducts = [];
        try {
          availableProducts = await prisma.productPurchase.findMany({
            where: {
              productId: product.productId,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              purchaseQuantity: true,
              declarationId: true,
              purchaseId: true,
              productId: true,
              purchaseUnitCostOfGoods: true,
            },
          });
        } catch (error) {
          console.error("Error retrieving available products:", error);
          throw new Error("Internal Server Error");
        }
        //calculate the total amount of products available for sale
        const totalPurchaseQuantity = availableProducts.reduce(
          (acc, item) => acc + item.purchaseQuantity,
          0
        );

        //Define how many products are to be sold
        let remainingSaleQuantity = parseInt(product.saleQuantity);
        let productPurchaseIndex = 0;

        //if the total amount of products available for sale is less than the amount to be sold, return an error
        if (remainingSaleQuantity > totalPurchaseQuantity) {
          throw new Error("Not Engough Products for Sale!");
        }
        if (createdSale === null) {
          try {
            createdSale = await prisma.sale.create({
              data: {
                invoiceNumber: parseInt(invoiceNumber),
                invoiceDate: new Date(invoiceDate),
                customer: {
                  connect: { id: customerId },
                },
              },
              include: {
                customer: true,
              },
            });
          } catch (error) {
            console.error("Error creating sale:", error);
            throw new Error("Internal Server Error");
          }
        }
        saleId = createdSale.id;
        let sale = null;
        while (remainingSaleQuantity > 0) {
          const productPurchase = availableProducts[productPurchaseIndex];
          let productDeclaration;

          //Find the declaration with the which the product was declared on
          try {
            productDeclaration = await prisma.productDeclaration.findFirst({
              where: {
                productId: productPurchase.productId,
                declarationId: productPurchase.declarationId,
              },
              select: {
                unitIncomeTax: true,
              },
            });
          } catch (error) {
            console.error("Error retrieving product declaration:", error);
            throw new Error("Internal Server Error");
          }
          //if the product purchase quantity is greater than the remaining sale quantity, create a one sale Detail entry and make the remainig sale quantity 0

          if (productPurchase.purchaseQuantity >= remainingSaleQuantity) {
            try {
              sale = await prisma.saleDetail.create({
                data: {
                  saleQuantity: remainingSaleQuantity,
                  saleUnitPrice: parseFloat(product.saleUnitPrice),
                  totalSales:
                    parseFloat(product.saleUnitPrice) * remainingSaleQuantity,
                  unitCostOfGoods:
                    productPurchase.purchaseUnitCostOfGoods +
                    productDeclaration.unitIncomeTax,
                  purchase: { connect: { id: productPurchase.purchaseId } },
                  declaration: {
                    connect: { id: productPurchase.declarationId },
                  },
                  product: { connect: { id: productPurchase.productId } },
                  sale: { connect: { id: saleId } },
                },
              });
            } catch (error) {
              console.error("Error creating sale:", error);
              throw new Error("Internal Server Error");
            }

            //update the productPurchase table
            try {
              await prisma.productPurchase.update({
                where: {
                  id: productPurchase.id,
                },
                data: {
                  purchaseQuantity:
                    productPurchase.purchaseQuantity - remainingSaleQuantity,
                },
              });
            } catch (error) {
              console.error("Error updating product purchase:", error);
              throw new Error("Internal Server Error");
            }

            remainingSaleQuantity = 0;
          }
          //if the product purchase quantity is less than the remaining sale quantity, create a sale Detail entry and update the product purchase table
          else if (
            remainingSaleQuantity > productPurchase.purchaseQuantity &&
            productPurchase.purchaseQuantity !== 0
          ) {
            try {
              sale = await prisma.saleDetail.create({
                data: {
                  saleQuantity: productPurchase.purchaseQuantity,
                  saleUnitPrice: parseFloat(product.saleUnitPrice),
                  totalSales:
                    product.saleUnitPrice * productPurchase.purchaseQuantity,
                  unitCostOfGoods:
                    productPurchase.purchaseUnitCostOfGoods +
                    productDeclaration.unitIncomeTax,
                  purchase: { connect: { id: productPurchase.purchaseId } },
                  declaration: {
                    connect: { id: productPurchase.declarationId },
                  },
                  product: { connect: { id: productPurchase.productId } },
                  sale: { connect: { id: saleId } },
                },
              });
            } catch (error) {
              console.error("Error creating sale:", error);
              throw new Error("Internal Server Error");
            }

            //update the productPurchase table
            try {
              await prisma.productPurchase.update({
                where: {
                  id: productPurchase.id,
                },
                data: {
                  purchaseQuantity: 0,
                },
              });
            } catch (error) {
              console.error("Error updating product purchase:", error);
              throw new Error("Internal Server Error");
            }

            remainingSaleQuantity -= productPurchase.purchaseQuantity;
            productPurchaseIndex += 1;
          }
        }
        //check if the product has inventory
        let inventoryEntries;
        try {
          inventoryEntries = await prisma.inventory.findMany({
            where: {
              productId: product.productId,
            },
          });
        } catch (error) {
          console.error("Error retrieving inventory:", error);
          throw new Error("Internal Server Error");
        }

        //if the product has no inventory, create a new inventory entry
        let isNewEntry = false;
        if (!inventoryEntries.length) {
          try {
            await prisma.inventory.create({
              data: {
                sale: {
                  connect: {
                    id: saleId,
                  },
                },
                saleDetail: {
                  connect: {
                    id: sale.id,
                  },
                },
                product: {
                  connect: {
                    id: product.productId,
                  },
                },
                balanceQuantity: product.saleQuantity,
              },
            });
            isNewEntry = true;
          } catch (error) {
            console.error("Error creating inventory:", error);
            throw new Error("Internal Server Error");
          }
        }

        //get the existing inventory entries to update the balance quantity
        try {
          inventoryEntries = await prisma.inventory.findMany({
            where: {
              productId: product.productId,
            },
            select: {
              balanceQuantity: true,
              purchaseId: true,
              saleId: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          });
        } catch (error) {
          console.error("Error retrieving inventory:", error);
          throw new Error("Internal Server Error");
        }

        //get the purchase entry and sale entry
        let purchaseEntry = inventoryEntries.find((entry) => entry.purchaseId);
        let saleEntry = inventoryEntries.find((entry) => entry.saleId);

        //create a new inventory entry
        if (!isNewEntry) {
          try {
            await prisma.inventory.create({
              data: {
                sale: {
                  connect: {
                    id: saleId,
                  },
                },
                saleDetail: {
                  connect: {
                    id: sale.id,
                  },
                },
                product: {
                  connect: {
                    id: product.productId,
                  },
                },
                balanceQuantity: saleEntry
                  ? saleEntry.balanceQuantity - product.saleQuantity
                  : purchaseEntry.balanceQuantity - product.saleQuantity,
              },
            });
          } catch (error) {
            console.error("Error creating inventory:", error);
            throw new Error("Internal Server Error");
          }
        }
        let chartOfAccounts = [];
        try {
          chartOfAccounts = await prisma.chartOfAccount.findMany({
            select: { id: true, name: true },
          });
        } catch {
          throw new Error("Error fetching Chart of Accounts");
        }

        const saleOfProductIncome = chartOfAccounts.find(
          (account) => account.name === "Sales of Product Income"
        );

        const accountsReceivable = chartOfAccounts.find(
          (account) => account.name === "Accounts Receivable (A/R)"
        );

        const costOfSales = chartOfAccounts.find(
          (account) => account.name === "Cost of sales"
        );

        const inventoryAsset = chartOfAccounts.find(
          (account) => account.name === "Inventory Asset"
        );

        //create the first two entries of the transaction
        try {
          await createTransaction(
            costOfSales.id,
            inventoryAsset.id,
            new Date(invoiceDate),
            `sale`,
            parseFloat(product.saleQuantity) * parseFloat(sale.unitCostOfGoods),
            null,
            null,
            null,
            createdSale.id,
            product.id,
            null
          );

          // create the second two entries of the transaction

          await createTransaction(
            saleOfProductIncome.id,
            accountsReceivable.id,
            new Date(invoiceDate),
            `sale`,
            null,
            parseFloat(sale.totalSales),
            null,
            null,
            createdSale.id,
            product.id,
            null
          );
        } catch (error) {
          console.error("Error creating transactions:", error);
          throw new Error("Internal Server Error");
        }
      }
    } catch (error) {
      console.error(error.message);
      throw new Error(error);
    }
    res.json(createdSale);
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ error: error.message });
  }
}

async function getSaleDetails(id) {
  try {
    const saleDetails = await prisma.saleDetail.findMany({
      where: {
        saleId: id,
      },
      select: {
        id: true,
        saleQuantity: true,
        saleUnitPrice: true,
        totalSales: true,
        unitCostOfGoods: true,
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unitOfMeasurement: true,
          },
        },
        declaration: {
          select: {
            id: true,
            number: true,
            date: true,
          },
        },
        purchase: {
          select: {
            id: true,
            number: true,
            date: true,
          },
        },
      },
    });
    return saleDetails;
  } catch (error) {
    console.error("Error retrieving Sale Details:", error);
    return res.status(500).send("Internal Server Error");
  }
}

async function getSaleDetailById(id) {
  try {
    const saleDetail = await prisma.saleDetail.findUnique({
      where: {
        id: id,
      },
      include: {
        product: true,
        declaration: true,
        purchase: true,
      },
    });

    return saleDetail;
  } catch (error) {
    console.error("Error retrieving Sale Detail:", error);
    return res.status(500).send("Internal Server Error");
  }
}

async function getSale(id) {
  try {
    const sale = await prisma.sale.findUnique({
      where: {
        id: id,
      },
      include: {
        customer: true,
      },
    });

    return sale;
  } catch (error) {
    console.error("Error retrieving Sale:", error);
    return res.status(500).send("Internal Server Error");
  }
}

async function getSaleById(req, res) {
  try {
    const { id } = req.params;
    const sale = await getSale(id);
    const saleDetails = await getSaleDetails(id);
    res.json({ ...sale, saleDetails });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).send(error.message);
  }
}

async function deleteSaleById(req, res) {
  try {
    const { id } = req.params;

    const deletedSale = await prisma.sale.delete({
      where: {
        id: id,
      },
    });
    res.json(deletedSale);
  } catch (error) {
    console.error("Error deleting Sale:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateSale(req, res) {}

module.exports = {
  getSales,
  createSale,
  getSaleById,
  getSale,
  getSaleDetails,
  getSaleDetailById,
  deleteSaleById,
  updateSale,
};

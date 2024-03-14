const e = require("cors");
const prisma = require("../../database");
const {
  createTransaction,
} = require("../caTransaction/caTransactionController");
const { parse } = require("path");

async function getPurchases(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.purchase.count();

    const purchases = await prisma.purchase.findMany({
      select: {
        id: true,
        date: true,
        number: true,
        truckNumber: true,
        exchangeRate: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      skip: (page - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: purchases,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving Purchases:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createPurchase(req, res) {
  try {
    const {
      date,
      number,
      truckNumber,
      exchangeRate,
      supplierId,
      transportCost,
      eslCustomCost,
      transitFees,
      purchaseProducts,
    } = req.body;

    let createdPurchase = null;
    let purchaseTotalAmount = 0;
    let accountsPayable;
    let inventoryAsset;
    const totalPurchaseQuantity = purchaseProducts.reduce(
      (total, productPurchase) =>
        total + parseInt(productPurchase.purchaseQuantity),
      0
    );

    for (product of purchaseProducts) {
      const currentDeclaration = await prisma.productDeclaration.findFirst({
        where: {
          AND: [
            { productId: product.productId },
            { declarationId: product.declarationId },
          ],
        },
      });
      const declarationBalance =
        currentDeclaration.declarationQuantity - product.purchasedQuantity;
      if (declarationBalance < 0) {
        res.status(400).send({
          error: `The purchase quantity for the product ${product.id} is greater than the declaration quantity`,
        });
      }
    }

    const createdProductPurchases = await Promise.all(
      purchaseProducts.map(async (purchaseProduct) => {
        if (!createdPurchase) {
          createdPurchase = await prisma.purchase.create({
            data: {
              date: new Date(date),
              number: parseInt(number),
              truckNumber,
              exchangeRate: parseFloat(exchangeRate),
              supplier: {
                connect: {
                  id: supplierId,
                },
              },
            },
          });
        }
        const createdProductPurchase = await prisma.productPurchase.create({
          data: {
            purchase: {
              connect: {
                id: createdPurchase.id,
              },
            },
            declaration: {
              connect: {
                id: purchaseProduct.declarationId,
              },
            },
            product: {
              connect: {
                id: purchaseProduct.productId,
              },
            },
            purchaseQuantity: parseInt(purchaseProduct.purchaseQuantity),
            purchaseUnitPriceETB: exchangeRate
              ? parseFloat(purchaseProduct.purchaseUnitPrice) *
                parseFloat(exchangeRate)
              : parseFloat(purchaseProduct.purchaseUnitPrice),
            purchaseUnitPriceUSD: exchangeRate
              ? parseFloat(purchaseProduct.purchaseUnitPrice)
              : 0,
            purchaseTotalETB: exchangeRate
              ? parseInt(purchaseProduct.purchaseQuantity) *
                parseFloat(purchaseProduct.purchaseUnitPrice) *
                parseFloat(exchangeRate)
              : parseInt(purchaseProduct.purchaseQuantity) *
                parseFloat(purchaseProduct.purchaseUnitPrice),
            purchaseUnitCostOfGoods: 0,
          },
        });

        const currentDeclaration = await prisma.productDeclaration.findFirst({
          where: {
            AND: [
              { productId: purchaseProduct.productId },
              { declarationId: purchaseProduct.declarationId },
            ],
          },
        });

        await prisma.productDeclaration.update({
          where: {
            id: currentDeclaration.id,
          },
          data: {
            purchasedQuantity:
              currentDeclaration.purchasedQuantity +
              parseInt(purchaseProduct.purchaseQuantity),
            declarationBalance:
              currentDeclaration.declarationQuantity -
              (currentDeclaration.purchasedQuantity +
                parseInt(purchaseProduct.purchaseQuantity)),
          },
        });

        return createdProductPurchase;
      })
    );

    for (const productPurchase of createdProductPurchases) {
      try {
        const transportFee = parseFloat(
          (transportCost * productPurchase.purchaseQuantity) /
            totalPurchaseQuantity
        );
        const eslCustomFee = parseFloat(
          (eslCustomCost * productPurchase.purchaseQuantity) /
            totalPurchaseQuantity
        );
        const transitFee = parseFloat(
          (transitFees * productPurchase.purchaseQuantity) /
            totalPurchaseQuantity
        );

        const transport = await prisma.transport.create({
          data: {
            purchase: {
              connect: {
                id: createdPurchase.id,
              },
            },
            date: createdPurchase.date,
            cost: transportFee,
            type: "Bill",
            productPurchase: {
              connect: {
                id: productPurchase.id,
              },
            },
          },
        });

        const eslCustom = await prisma.ESL.create({
          data: {
            purchase: {
              connect: {
                id: createdPurchase.id,
              },
            },
            date: createdPurchase.date,
            cost: eslCustomFee,
            type: "Bill",
            productPurchase: {
              connect: {
                id: productPurchase.id,
              },
            },
          },
        });

        const transit = await prisma.transit.create({
          data: {
            purchase: {
              connect: {
                id: createdPurchase.id,
              },
            },
            date: createdPurchase.date,
            cost: transitFee,
            type: "Bill",
            productPurchase: {
              connect: {
                id: productPurchase.id,
              },
            },
          },
        });

        const updatedProductPurchase = await prisma.productPurchase.update({
          where: { id: productPurchase.id },
          data: {
            purchaseUnitCostOfGoods:
              (transportFee + eslCustomFee + transitFee) /
                parseInt(productPurchase.purchaseQuantity) +
              parseFloat(productPurchase.purchaseUnitPriceETB),
          },
        });
      } catch (error) {
        console.error("Error creating a product purchase:", error);
        throw new Error(error);
      }

      //check if the product has invetory entries
      let inventoryEntries;
      try {
        inventoryEntries = await prisma.inventory.findMany({
          where: {
            productId: productPurchase.productId,
          },
        });
      } catch (error) {
        console.error("Error retrieving inventory:", error);
        throw new Error(error);
      }

      //if the product has no inventory entries, create one
      let isNewEntry = false;
      if (!inventoryEntries.length) {
        try {
          await prisma.inventory.create({
            data: {
              purchase: {
                connect: {
                  id: productPurchase.purchaseId,
                },
              },
              productPurchase: {
                connect: {
                  id: productPurchase.id,
                },
              },
              product: {
                connect: {
                  id: productPurchase.productId,
                },
              },
              balanceQuantity: productPurchase.purchaseQuantity,
            },
          });
          isNewEntry = true;
        } catch (error) {
          console.error("Error creating inventory:", error);
          throw new Error(error);
        }
      }

      //get the existing inventory entries to update the balance quantity
      try {
        inventoryEntries = await prisma.inventory.findMany({
          where: {
            productId: productPurchase.productId,
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
        throw new Error(error);
      }

      //get the last purchase and sale entries
      let purchaseEntry = inventoryEntries.find((entry) => entry.purchaseId);
      let saleEntry = inventoryEntries.find((entry) => entry.saleId);

      //create a new inventory entry
      if (!isNewEntry) {
        try {
          await prisma.inventory.create({
            data: {
              purchase: {
                connect: {
                  id: productPurchase.purchaseId,
                },
              },
              productPurchase: {
                connect: {
                  id: productPurchase.id,
                },
              },
              product: {
                connect: {
                  id: productPurchase.productId,
                },
              },
              balanceQuantity: saleEntry
                ? saleEntry.balanceQuantity + productPurchase.purchaseQuantity
                : purchaseEntry.balanceQuantity +
                  productPurchase.purchaseQuantity,
            },
          });
        } catch (error) {
          console.error("Error creating inventory:", error);
          throw new Error(error);
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

      accountsPayable = chartOfAccounts.find(
        (account) => account.name === "Accounts Payable (A/P) - USD"
      );

      inventoryAsset = chartOfAccounts.find(
        (account) => account.name === "Inventory Asset"
      );

      //create a transaction entry for the debit
      try {
        await createTransaction(
          inventoryAsset.id,
          new Date(date),
          productPurchase.declarationId,
          "Bill",
          productPurchase.purchaseTotal,
          null,
          productPurchase.purchaseId,
          productPurchase.id,
          null,
          null,
          supplierId,
          null,
          null,
          null
        );
        purchaseTotalAmount += productPurchase.purchaseTotal;
      } catch (error) {
        console.error("Error creating transaction:", error);
        throw new Error(error);
      }
    }

    //create a transaction entry for the credit
    try {
      await createTransaction(
        accountsPayable.id,
        new Date(date),
        "Purchase",
        "Bill",
        null,
        purchaseTotalAmount,
        createdPurchase.id,
        null,
        null,
        null,
        supplierId,
        null,
        parseFloat(exchangeRate),
        purchaseTotalAmount / parseFloat(exchangeRate)
      );
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw new Error(error);
    }

    res.json(createdPurchase);
  } catch (error) {
    console.error("Error creating purchase:", error);
    res.status(500).send({ error: error.message });
  }
}

async function getPurchase(id) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        number: true,
        date: true,
        truckNumber: true,
      },
    });

    if (!purchase) {
      return { error: "Purchase not found" };
    }

    return purchase;
  } catch (error) {
    console.error("Error retrieving purchase:", error);
    return { error: "Internal Server Error" };
  }
}

async function getProductPurchaseById(id) {
  try {
    const productPurchase = await prisma.productPurchase.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        purchaseQuantity: true,
        purchaseUnitPriceETB: true,
        purchaseUnitPriceUSD: true,
        purchaseTotalETB: true,
        purchaseUnitCostOfGoods: true,
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
      },
    });
    return productPurchase;
  } catch (error) {
    console.error("Error retrieving product purchase:", error);
    return { error: "Internal Server Error" };
  }
}

async function getProductPurchases(id) {
  try {
    const productPurchases = await prisma.productPurchase.findMany({
      where: {
        purchaseId: id,
      },
      select: {
        id: true,
        purchaseQuantity: true,
        purchaseUnitPriceETB: true,
        purchaseUnitPriceUSD: true,
        purchaseTotalETB: true,
        purchaseUnitCostOfGoods: true,
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
      },
    });
    return productPurchases;
  } catch (error) {
    console.error("Error retrieving product purchase:", error);
    return { error: "Internal Server Error" };
  }
}

async function getPurchaseById(req, res) {
  try {
    const { id } = req.params;
    const purchase = await getPurchase(id);
    const productPurchases = await getProductPurchases(id);

    res.json({ ...purchase, productPurchases });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).send(error.message);
  }
}

async function updatePurchase(req, res) {
  try {
    const { id } = req.params;
    const {
      date,
      number,
      truckNumber,
      exchangeRate,
      supplierId,
      transportCost,
      eslCustomCost,
      transitFees,
      productPurchases,
    } = req.body;

    const saleDetail = await prisma.saleDetail.findFirst({
      where: {
        purchaseId: id,
      },
    });

    if (saleDetail) {
      return res.status(400).json({
        error:
          "Cannot update purchase with associated sale, Please delete the sale first.",
      });
    }
    const totalPurchaseQuantity = productPurchases.reduce(
      (total, productPurchase) =>
        total + parseInt(productPurchase.purchaseQuantity),
      0
    );

    for (product of productPurchases) {
      const currentDeclaration = await prisma.productDeclaration.findFirst({
        where: {
          AND: [
            { productId: product.productId },
            { declarationId: product.declarationId },
          ],
        },
      });
      const declarationBalance =
        currentDeclaration.declarationQuantity - product.purchasedQuantity;
      if (declarationBalance < 0) {
        res.status(400).send({
          error: `The purchase quantity for the product ${product.id} is greater than the declaration quantity`,
        });
      }
    }

    const updatedPurchase = await prisma.purchase.update({
      where: { id: id },
      data: {
        date: new Date(date),
        number: parseInt(number),
        truckNumber,
        exchangeRate: parseFloat(exchangeRate),
        supplier: {
          connect: {
            id: supplierId,
          },
        },
      },
    });

    const updatedProductPurchases = await Promise.all(
      productPurchases.map(async (productPurchase) => {
        let currentDeclaration;
        try {
          currentDeclaration = await prisma.productDeclaration.findFirst({
            where: {
              AND: [
                { productId: productPurchase.productId },
                { declarationId: productPurchase.declarationId },
              ],
            },
          });
        } catch (error) {
          console.error("Error retrieving declaration:", error);
          throw new Error(error);
        }

        if (currentDeclaration) {
          await prisma.productDeclaration.update({
            where: {
              id: currentDeclaration.id,
            },
            data: {
              purchasedQuantity:
                currentDeclaration.purchasedQuantity +
                parseInt(productPurchase.purchaseQuantity),
              declarationBalance:
                currentDeclaration.declarationQuantity -
                (currentDeclaration.purchasedQuantity +
                  parseInt(productPurchase.purchaseQuantity)),
            },
          });
        }

        //find an exisiting product purchase with purchaseId, productId and declarationId
        let currentProductPurchase;
        let updatedProductPurchase;
        try {
          currentProductPurchase = await prisma.productPurchase.findFirst({
            where: {
              AND: [
                { purchaseId: id },
                { productId: productPurchase.productId },
                { declarationId: productPurchase.declarationId },
              ],
            },
          });
        } catch (error) {
          console.error("Error retrieving product purchase:", error);
          throw new Error(error);
        }

        try {
          const transportFee = parseFloat(
            (transportCost * productPurchase.purchaseQuantity) /
              totalPurchaseQuantity
          );
          const eslCustomFee = parseFloat(
            (eslCustomCost * productPurchase.purchaseQuantity) /
              totalPurchaseQuantity
          );
          const transitFee = parseFloat(
            (transitFees * productPurchase.purchaseQuantity) /
              totalPurchaseQuantity
          );

          await prisma.transport.upsert({
            where: {
              productPurchaseId: productPurchase.id,
            },
            update: {
              date: updatedPurchase.date,
              cost: transportFee,
            },
            create: {
              purchase: {
                connect: {
                  id: updatedPurchase.id,
                },
              },
              date: updatedPurchase.date,
              cost: transportFee,
              type: "Bill",
              productPurchase: {
                connect: {
                  id: productPurchase.id,
                },
              },
            },
          });

          const eslCustom = await prisma.ESL.upsert({
            where: {
              productPurchaseId: productPurchase.id,
            },
            update: {
              date: updatedPurchase.date,
              cost: eslCustomFee,
            },
            create: {
              purchase: {
                connect: {
                  id: updatedPurchase.id,
                },
              },
              date: updatedPurchase.date,
              cost: eslCustomFee,
              type: "Bill",
              productPurchase: {
                connect: {
                  id: productPurchase.id,
                },
              },
            },
          });

          const transit = await prisma.transit.upsert({
            where: {
              productPurchaseId: productPurchase.id,
            },
            update: {
              date: updatedPurchase.date,
              cost: transitFee,
            },
            create: {
              purchase: {
                connect: {
                  id: updatedPurchase.id,
                },
              },
              date: updatedPurchase.date,
              cost: transitFee,
              type: "Bill",
              productPurchase: {
                connect: {
                  id: productPurchase.id,
                },
              },
            },
          });

          //update the product purchase
          updatedProductPurchase = await prisma.productPurchase.upsert({
            where: { id: currentProductPurchase.id },
            update: {
              purchaseQuantity: parseInt(productPurchase.purchaseQuantity),
              purchaseUnitPriceETB:
                parseFloat(productPurchase.purchaseUnitPrice) *
                parseFloat(exchangeRate),
              purchaseUnitPriceUSD: parseFloat(
                productPurchase.purchaseUnitPrice
              ),
              purchaseTotalETB:
                parseInt(productPurchase.purchaseQuantity) *
                parseFloat(productPurchase.purchaseUnitPrice),
              purchaseUnitCostOfGoods:
                (transportFee + eslCustomFee + transitFee) /
                  parseInt(productPurchase.purchaseQuantity) +
                parseFloat(productPurchase.purchaseUnitPrice) *
                  parseFloat(exchangeRate),
            },
            create: {
              purchase: {
                connect: {
                  id: id,
                },
              },
              declaration: {
                connect: {
                  id: productPurchase.declarationId,
                },
              },
              product: {
                connect: {
                  id: productPurchase.productId,
                },
              },
              purchaseQuantity: parseInt(productPurchase.purchaseQuantity),
              purchaseUnitPriceETB:
                parseFloat(productPurchase.purchaseUnitPrice) *
                parseFloat(exchangeRate),
              purchaseUnitPriceUSD: parseFloat(
                productPurchase.purchaseUnitPrice
              ),
              purchaseTotalETB:
                parseInt(productPurchase.purchaseQuantity) *
                parseFloat(productPurchase.purchaseUnitPrice),
              purchaseUnitCostOfGoods:
                (transportFee + eslCustomFee + transitFee) /
                  parseInt(productPurchase.purchaseQuantity) +
                parseFloat(productPurchase.purchaseUnitPrice) *
                  parseFloat(exchangeRate),
            },
          });
        } catch (error) {
          console.error("Error creating a product purchase:", error);
          throw new Error(error);
        }
        //Get the product has invetory entries
        let inventoryEntry;
        try {
          inventoryEntry = await prisma.inventory.findMany({
            where: {
              purchaseId: productPurchase.purchaseId,
            },
          });
        } catch (error) {
          console.error("Error retrieving inventory:", error);
          throw new Error(error);
        }

        //update the inventory entry of the specific purchase
        try {
          await prisma.inventory.update({
            where: {
              id: inventoryEntry[0].id,
            },
            data: {
              balanceQuantity: updatedProductPurchase.purchaseQuantity,
            },
          });
        } catch (error) {
          console.error("Error updating inventory:", error);
          throw new Error(error);
        }

        //get the CA transactions associted with this purchase
        let caTransactions;
        try {
          caTransactions = await prisma.CATransaction.findMany({
            where: {
              productPurchaseId: productPurchase.id,
            },
            orderBy: {
              createdAt: "desc",
            },
          });
        } catch (error) {
          console.error("Error retrieving CA transactions:", error);
          throw new Error(error);
        }

        // update the CA transactions
        try {
          await prisma.CATransaction.update({
            where: {
              id: caTransactions[0].id,
            },
            data: {
              credit: updatedProductPurchase.purchaseTotal,
            },
          });

          await prisma.CATransaction.update({
            where: {
              id: caTransactions[1].id,
            },
            data: {
              debit: updatedProductPurchase.purchaseTotal,
            },
          });
        } catch (error) {
          console.error("Error updating CA transactions:", error);
          throw new Error(error);
        }

        return updatedProductPurchase;
      })
    );

    res.json(updatedPurchase);
  } catch (error) {
    console.error("Error updating purchase:", error);
    res.status(500).send({ error: error.message });
  }
}

async function deletePurchase(req, res) {
  try {
    const { id } = req.params;
    //check if there is a sale Detail for the purchase
    const saleDetail = await prisma.saleDetail.findFirst({
      where: {
        purchaseId: id,
      },
    });

    if (saleDetail) {
      return res.status(400).json({
        error:
          "Cannot delete purchase with associated sale, Please delete the sale first.",
      });
    }

    const productPurchases = await prisma.productPurchase.findMany({
      where: {
        purchaseId: id,
      },
    });

    for (let productPurchase of productPurchases) {
      const currentDeclaration = await prisma.productDeclaration.findFirst({
        where: {
          AND: [
            { productId: productPurchase.productId },
            { declarationId: productPurchase.declarationId },
          ],
        },
      });

      await prisma.productDeclaration.update({
        where: {
          id: currentDeclaration.id,
        },
        data: {
          purchasedQuantity:
            currentDeclaration.purchasedQuantity -
            parseInt(productPurchase.purchaseQuantity),
          declarationBalance:
            currentDeclaration.declarationQuantity -
            (currentDeclaration.purchasedQuantity -
              parseInt(productPurchase.purchaseQuantity)),
        },
      });

      const inventoryEntry = await prisma.inventory.findMany({
        where: {
          purchaseId: id,
        },
      });

      await prisma.inventory.deleteMany({
        where: {
          id: inventoryEntry[0].id,
        },
      });

      const caTransactions = await prisma.CATransaction.findMany({
        where: {
          productPurchaseId: productPurchase.id,
        },
      });

      for (let caTransaction of caTransactions) {
        await prisma.CATransaction.delete({
          where: {
            id: caTransaction.id,
          },
        });
      }
    }

    const deletedPurchase = await prisma.purchase.delete({
      where: { id: id },
    });

    res.json(deletedPurchase);
  } catch (error) {
    console.error("Error deleting purchase:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getPurchases,
  createPurchase,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getPurchase,
  getProductPurchases,
  getProductPurchaseById,
};

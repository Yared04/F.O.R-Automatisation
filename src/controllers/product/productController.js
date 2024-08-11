const prisma = require("../../database");
const {
  createTransaction,
} = require("../caTransaction/caTransactionController");

async function getProducts(req, res) {
  try {
    const { page, pageSize } = req.query;
    const totalCount = await prisma.product.count();

    let products;
    if (page && pageSize) {
      products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          unitOfMeasurement: true,
          startingQuantity: true,
          startingQuantityUnitPrice: true,
          startingQuantityDate: true,
        },
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
      });
    } else {
      products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          unitOfMeasurement: true,
          startingQuantity: true,
          startingQuantityUnitPrice: true,
          startingQuantityDate: true,
        },
      });
    }

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: products,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving products:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: id,
      },
    });

    res.json(product);
  } catch (error) {
    console.error("Error retrieving product by id:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createProduct(req, res) {
  try {
    const {
      name,
      unitOfMeasurement,
      startingQuantity,
      startingQuantityUnitPrice,
      category,
      startingQuantityDate,
    } = req.body;

    const existingProduct = await prisma.product.findFirst({
      where: {
        name: name,
      },
    });

    if (existingProduct) {
      return res.status(400).json({ error: "This product is already exists." });
    }
    const createdProduct = await prisma.product.create({
      data: {
        name: name,
        productCategoryId: category.id,
        unitOfMeasurementId: unitOfMeasurement.id,
        startingQuantity: parseInt(startingQuantity),
        startingQuantityUnitPrice: parseFloat(startingQuantityUnitPrice),
        startingQuantityDate: new Date(startingQuantityDate),
      },
      include: {
        category: true,
        unitOfMeasurement: true,
      },
    });

    const createdProductPurchase = await prisma.productPurchase.create({
      data: {
        product: {
          connect: {
            id: createdProduct.id,
          },
        },
        date: new Date(startingQuantityDate),
        purchaseQuantity: parseInt(startingQuantity),
        purchaseUnitPriceETB: parseFloat(startingQuantityUnitPrice),
      },
    });

    const inventory = await prisma.inventory.create({
      data: {
        product: {
          connect: {
            id: createdProduct.id,
          },
        },
        productPurchase: {
          connect: {
            id: createdProductPurchase.id,
          },
        },
        balanceQuantity: parseInt(startingQuantity),
        createdAt: startingQuantityDate,
      },
    });

    let chartOfAccounts = [];
    try {
      chartOfAccounts = await prisma.chartOfAccount.findMany({
        select: { id: true, name: true },
      });
    } catch {
      throw new Error("Error fetching Chart of Accounts");
    }

    const openingBalance = chartOfAccounts.find(
      (account) => account.name === "Opening Balance"
    );

    const inventoryAsset = chartOfAccounts.find(
      (account) => account.name === "Inventory Asset"
    );

    await createTransaction(
      inventoryAsset.id,
      null,
      new Date(startingQuantityDate),
      `${createdProduct.name} - opening inv.`,
      "Inventory Starting Value",
      0,
      null,
      null,
      createdProductPurchase.id,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      0
    );

    await createTransaction(
      openingBalance.id,
      null,
      new Date(startingQuantityDate),
      `${createdProduct.name} - opening inv.`,
      "Inventory Starting Value",
      0,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      0
    );

    res.json(createdProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      unitOfMeasurement,
      startingQuantity,
      startingQuantityUnitPrice,
      category,
      startingQuantityDate,
    } = req.body;

    const existingProduct = await prisma.product.findFirst({
      where: {
        name: name,
      },
    });

    if (existingProduct && existingProduct.id !== id) {
      return res
        .status(400)
        .json({ error: "There is already a product by this name." });
    }
    const updatedProduct = await prisma.product.update({
      where: {
        id: id,
      },
      data: {
        name: name,
        productCategoryId: category.id,
        unitOfMeasurementId: unitOfMeasurement.id,
        startingQuantity: parseInt(startingQuantity),
        startingQuantityUnitPrice: parseFloat(startingQuantityUnitPrice),
        startingQuantityDate: new Date(startingQuantityDate),
      },
      include: {
        category: true,
        unitOfMeasurement: true,
      },
    });

    const productPurchases = await prisma.productPurchase.updateMany({
      where: {
        productId: id,
        purchaseId: null,
      },
      data: {
        date: new Date(startingQuantityDate),
        purchaseQuantity: parseInt(startingQuantity),
        purchaseUnitPriceETB: parseFloat(startingQuantityUnitPrice),
      },
    });

    //update the inaventory entry
    const inventory = await prisma.inventory.findFirst({
      where: {
        AND: [
          {
            productId: id,
            purchaseId: null,
            saleId: null,
          },
        ],
      },
    });

    if (inventory) {
      const updatedInventory = await prisma.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          balanceQuantity: parseInt(startingQuantity),
          createdAt: new Date(startingQuantityDate),
        },
      });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: id,
      },
    });

    const declaration = await prisma.productDeclaration.findFirst({
      where: {
        productId: id,
      },
    });

    if (declaration) {
      return res.status(400).json({
        error: "Can not delete product, There are related declarations.",
      });
    }

    const productPurchase = await prisma.productPurchase.deleteMany({
      where: {
        purchaseId: null,
        productId: id,
      },
    });

    const caTransactions = await prisma.cATransaction.deleteMany({
      where: {
        OR: [
          {
            productPurchase: {
              product: {
                id: id,
              },
            },
          },
          {
            saleDetail: {
              product: {
                id: id,
              },
            },
          },
          {
            remark: {
              equals: `${product.name} - opening inv.`,
            },
          },
        ],
      },
    });

    const deletedProduct = await prisma.product.delete({
      where: {
        id: id,
      },
    });

    res.send(deletedProduct);
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
};

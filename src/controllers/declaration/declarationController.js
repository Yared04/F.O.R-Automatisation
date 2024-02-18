const prisma = require("../../database");

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
    const { number, date, declarationProducts } = req.body;
    const createdDeclaration = await prisma.declaration.create({
      data: {
        number,
        date: new Date(date),
      },
    });
    const createdDeclarationProducts = await Promise.all(
      declarationProducts.map(async (dp) => {
        let createdDeclarationProduct = await prisma.productDeclaration.create({
          data: {
            declarationQuantity: parseInt(dp.declarationQuantity),
            totalIncomeTax: parseInt(dp.totalIncomeTax),
            unitIncomeTax: dp.totalIncomeTax / dp.declarationQuantity,
            purchasedQuantity: 0,
            declarationBalance: 0,
            product: { connect: { id: parseInt(dp.productId) } },
            declaration: { connect: { id: createdDeclaration.id } },
          },
        });
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
    const { number, date, declarationProducts } = req.body; // Extract updated data from request body

    // Update the Declaration
    const updatedDeclaration = await prisma.declaration.update({
      where: { id: parseInt(id) }, // Convert id to integer if needed
      data: {
        number,
        date,
      },
    });

    // Update the associated products
    const updatedDeclarationProducts = await Promise.all(
      declarationProducts.map(async (dp) => {
        let updatedDeclarationProduct = await prisma.productDeclaration.upsert({
          where: {
            productId_declarationId: {
              productId: parseInt(dp.product.id),
              declarationId: parseInt(id),
            },
          },
          update: {
            declarationQuantity: parseInt(dp.declarationQuantity),
            totalIncomeTax: parseInt(dp.totalIncomeTax),
            unitIncomeTax: dp.totalIncomeTax / dp.declarationQuantity,
          },
          create: {
            declarationQuantity: parseInt(dp.declarationQuantity),
            totalIncomeTax: parseInt(dp.totalIncomeTax),
            unitIncomeTax: dp.totalIncomeTax / dp.declarationQuantity,
            productId: parseInt(dp.product.id),
            declarationId: parseInt(id),
            declarationBalance: 0,
            purchasedQuantity: 0,

          },
        });
        return updatedDeclarationProduct;
      })
    );

    // If the declaration is not found, return a 404 response
    if (!updatedDeclaration) {
      return res.status(404).json({ error: "Declaration not found" });
    }

    res.json({ updatedDeclaration, updatedDeclarationProducts });
  } catch (error) {
    console.error("Error updating declaration:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteDeclaration(req, res) {
  try {
    const { id } = req.params; // Extract the declaration ID from request parameters

    // Delete the associated product declarations
    await prisma.productDeclaration.deleteMany({
      where: {
        declarationId: parseInt(id),
      },
    });

    // Delete the declaration
    const deletedDeclaration = await prisma.declaration.delete({
      where: {
        id: parseInt(id),
      },
    });

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
        id: parseInt(id), // Convert id to integer if needed
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
        declarationId: parseInt(id), // Convert id to integer if needed
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

module.exports = {
  getDeclarationById,
  updateDeclaration,
  getDeclarations,
  createDeclaration,
  deleteDeclaration,
};

const prisma = require("../../database");

async function getDeclarations(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
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
    res.json({
      items: declarationsWithProducts,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
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
        date,
      },
    });
    const createdDeclarationProducts = await Promise.all(
      declarationProducts.map(async (dp) => {
        let createdDeclarationProduct = await prisma.productDeclaration.create({
          data: {
            declarationQuantity: dp.declarationQuantity,
            totalIncomeTax: dp.totalIncomeTax,
            unitIncomeTax: dp.totalIncomeTax / dp.declarationQuantity,
            purchasedQuantity: 0,
            declarationBalance: 0,
            product: { connect: { id: dp.productId } },
            declaration: { connect: { id: createdDeclaration.id } },
          },
        });
        return createdDeclarationProduct; // Return the createdDeclarationProduct
      })
    );

    res.json({ createdDeclaration, createdDeclarationProducts });
  } catch (error) {
    console.error("Error creating declaration:", error);
    res.status(500).send("Internal Server Error");
  }
}


async function deleteDeclaration(req, res) {
  try {
    const { id } = req.params;
    const deletedDeclaration = await prisma.declaration.delete({
      where: { id: parseInt(id) },
    });
    res.json(deleteDeclaration);
  } catch (error) {
    console.error("Error deleting declaration: ", error);
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
  getDeclarations,
  createDeclaration,
  deleteDeclaration,
};

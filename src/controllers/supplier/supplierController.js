const prisma = require("../../database");

async function getSuppliers(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    let totalCount;
    let suppliers;

    if (page && pageSize) {
      totalCount = await prisma.supplier.count();

      suppliers = await prisma.supplier.findMany({
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
      });
    } else {
      suppliers = await prisma.supplier.findMany();
      totalCount = suppliers.length;
    }

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: suppliers,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving Suppliers:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createSupplier(req, res) {
  try {
    const { name, address, currency } = req.body;

    const createdSupplier = await prisma.supplier.create({
      data: {
        name,
        address,
        currency
      },
    });

    res.json(createdSupplier);
  } catch (error) {
    console.error("Error creating Supplier:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateSupplier(req, res) {
  try {
    const SupplierId = req.params.id;
    const { name, address, currency } = req.body;

    const updatedSupplier = await prisma.supplier.update({
      where: { id: SupplierId },
      data: {
        name: name,
        address: address,
        currency: currency
      },
    });

    res.json(updatedSupplier);
  } catch (error) {
    console.error("Error updating Supplier:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteSupplier(req, res) {
  try {
    const SupplierId = req.params.id;

    const supplier = await prisma.supplier.findUnique({
      where: { id: SupplierId },
    });

    if(supplier.isSeeded){
      return res.status(400).json({
        error:
          "You can not delete this supplier since it is used in operations.",
      });
    }

    const deletedSupplier = await prisma.supplier.delete({
      where: { id: SupplierId },
    });

    res.json(deletedSupplier);
  } catch (error) {
    console.error("Error deleting Supplier:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getSupplierById(req, res) {
  try {
    const SupplierId = req.params.id;

    const Supplier = await prisma.supplier.findUnique({
      where: { id: SupplierId },
    });

    res.json(Supplier);
  } catch (error) {
    console.error("Error retrieving Supplier:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getSupplierPayment(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const supplierId = req.params.id;    
    const totalCount = await prisma.purchase.count({
      where: {
        supplierId: supplierId,
        NOT: {
          products: {
            some: {} // This ensures that at least one sale exists, effectively filtering out sales where there are no sales
          }
        }
      }
    });
    
    const purchases = await prisma.purchase.findMany({
      where: {
        supplierId: supplierId,
        NOT: {
          products: {
            some: {} // This ensures that at least one sale exists, effectively filtering out sales where there are no sales
          }
        }
      },
      select: {
        id: true,
        date: true,
        number: true,
        truckNumber: true,
        exchangeRate: true,
        paymentStatus: true,
        paidAmountETB: true,
        paidAmountUSD: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        products: true,
        transports: true,
        esls: true,
        transits: true,
      },
      orderBy: {
        createdAt: "desc",
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
    console.error("Error retrieving Sales:", error);
    res.status(500).send("Internal Server Error");
  }
} 

async function getSupplierPurchase(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const supplierId = req.params.id;    
    const totalCount = await prisma.purchase.count({
      where: {
        supplierId: supplierId,
          products: {
            some: {} // This ensures that at least one sale exists, effectively filtering out sales where there are no sales
          }
      }
    });
    
    const purchases = await prisma.purchase.findMany({
      where: {
        supplierId: supplierId,
          products: {
            some: {} // This ensures that at least one sale exists, effectively filtering out sales where there are no sales
        }
      },
      select: {
        id: true,
        date: true,
        number: true,
        truckNumber: true,
        exchangeRate: true,
        paymentStatus: true,
        paidAmountETB: true,
        paidAmountUSD: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        products: true,
        transports: true,
        esls: true,
        transits: true,
      },
      orderBy: {
        createdAt: "desc",
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
    console.error("Error retrieving purchases:", error);
    res.status(500).send("Internal Server Error");
  }
} 


module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierById,
  getSupplierPayment,
  getSupplierPurchase
};

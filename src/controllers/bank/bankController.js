const prisma = require("../../database");

async function getBanks(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;

    let banks;
    let totalCount;

    if (page && pageSize) {
      totalCount = await prisma.bank.count();
      banks = await prisma.bank.findMany({
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
        orderBy: { createdAt: "desc" },
      });
    } else {
      banks = await prisma.bank.findMany({
        orderBy: { createdAt: "desc" },
      });

      totalCount = banks.length;
    }

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: banks,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error getting banks:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getBankById(req, res) {
  try {
    const bankId = req.params.id;
    const bank = await prisma.bank.findUnique({
      where: { id: bankId },
    });
    res.json(bank);
  } catch (error) {
    console.error("Error getting bank:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createBank(req, res) {
  const { name, address, startingValue, startingValueDate } = req.body;
  try {
    const createdBank = await prisma.bank.create({
      data: {
        name: name,
        address: address,
        startingValue: parseFloat(startingValue),
        startingValueDate: new Date(startingValueDate),
        balance: parseFloat(startingValue),
      },
    });
    res.json(createdBank);
  } catch (error) {
    console.error("Error creating bank:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateBank(req, res) {
  try {
    const bankId = req.params.id;
    const { name, address, startingValue, startingValueDate } = req.body;

    const updatedBank = await prisma.bank.update({
      where: { id: bankId },
      data: {
        name: name,
        address: address,
        startingValue: parseFloat(startingValue),
        startingValueDate: new Date(startingValueDate),
        balance: parseFloat(startingValue),
      },
    });

    res.json(updatedBank);
  } catch (error) {
    console.error("Error updating bank:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteBank(req, res) {
  try {
    const bankId = req.params.id;

    const deletedBank = await prisma.bank.delete({
      where: { id: bankId },
    });

    res.json(deletedBank);
  } catch (error) {
    console.error("Error deleting bank:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getBanks,
  createBank,
  updateBank,
  deleteBank,
  getBankById,
};

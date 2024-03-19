const e = require("express");
const prisma = require("../../database");

async function getAllExpenses(req, res) {
  try {
    expenses = await prisma.ChartOfAccount.findMany({
      where: {
        accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
      },
    });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching all expenses:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getAllBanks(req, res) {
  try {
    banks = await prisma.ChartOfAccount.findMany({
      where: {
        accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
      },
    });
    res.json(banks);
  } catch (error) {
    console.error("Error fetching all banks:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getAllChartOfAccounts(req, res) {
  try {
    const { page, pageSize } = req.query;

    let chartOfAccounts;
    let totalCount;

    if (page && pageSize) {
      totalCount = await prisma.ChartOfAccount.count();
      chartOfAccounts = await prisma.ChartOfAccount.findMany({
        include: {
          accountType: true,
          accountSubType: true,
        },
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
        orderBy: { createdAt: "desc" },
      });
    } else {
      chartOfAccounts = await prisma.ChartOfAccount.findMany({
        include: {
          accountType: true,
          accountSubType: true,
        },
        orderBy: { createdAt: "desc" },
      });
      totalCount = chartOfAccounts.length;
    }

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: chartOfAccounts,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error fetching all cash of accounts:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createChartOfAccount(req, res) {
  try {
    const { name, accountTypeId, accountSubTypeId } = req.body;

    const createdChartOfAccount = await prisma.ChartOfAccount.create({
      data: {
        name,
        accountTypeId,
        accountSubTypeId,
      },
      include: {
        accountType: true,
        accountSubType: true,
      },
    });

    res.json(createdChartOfAccount);
  } catch (error) {
    console.error("Error creating cash of account:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateChartOfAccount(req, res) {
  try {
    const { id } = req.params;
    const { name, accountTypeId, accountSubTypeId } = req.body;

    const updatedChartOfAccount = await prisma.ChartOfAccount.update({
      where: {
        id,
      },
      data: {
        name,
        accountTypeId,
        accountSubTypeId,
      },
      include: {
        accountType: true,
        accountSubType: true,
      },
    });

    res.json(updatedChartOfAccount);
  } catch (error) {
    console.error("Error updating cash of account:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteChartOfAccount(req, res) {
  try {
    const { id } = req.params;

    await prisma.ChartOfAccount.delete({
      where: {
        id,
      },
    });

    res.json({ message: "Cash of account deleted successfully" });
  } catch (error) {
    console.error("Error deleting cash of account:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getOneChartOfAccount(req, res) {
  try {
    const { id } = req.params;

    const ChartOfAccount = await prisma.ChartOfAccount.findUnique({
      where: {
        id,
      },
      include: {
        accountType: true,
        accountSubType: true,
      },
    });

    if (!ChartOfAccount) {
      return res.status(404).json({ error: "Cash of account not found" });
    }

    res.json(ChartOfAccount);
  } catch (error) {
    console.error("Error fetching cash of account:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getAllChartOfAccounts,
  createChartOfAccount,
  updateChartOfAccount,
  deleteChartOfAccount,
  getOneChartOfAccount,
  getAllExpenses,
  getAllBanks,
};

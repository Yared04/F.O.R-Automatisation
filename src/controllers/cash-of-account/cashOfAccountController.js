const prisma = require("../../database");

async function getAllCashOfAccounts(req, res) {
    try {
        const { page = 1, pageSize = 10 } = req.query;

        let cashOfAccounts;
        let totalCount;

        if (page && pageSize) {
            totalCount = await prisma.cashOfAccount.count();
            cashOfAccounts = await prisma.cashOfAccount.findMany({
                include: {
                    accountType: true,
                    accountSubType: true,
                },
                skip: (page - 1) * parseInt(pageSize, 10),
                take: parseInt(pageSize, 10),
                orderBy: { createdAt: 'desc' },
            });
        } else {
            cashOfAccounts = await prisma.cashOfAccount.findMany({
                include: {
                    accountType: true,
                    accountSubType: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            totalCount = cashOfAccounts.length;
        }

        const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

        res.json({
            items: cashOfAccounts,
            totalCount: totalCount,
            pageSize: parseInt(pageSize, 10),
            currentPage: parseInt(page, 10),
            totalPages: totalPages,
        });

    } catch (error) {
        console.error('Error fetching all cash of accounts:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function createCashOfAccount(req, res) {
    try {
        const { name, accountTypeId, accountSubTypeId } = req.body;

        const createdCashOfAccount = await prisma.cashOfAccount.create({
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

        res.json(createdCashOfAccount);
    } catch (error) {
        console.error('Error creating cash of account:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function updateCashOfAccount(req, res) {
    try {
        const { id } = req.params;
        const { name, accountTypeId, accountSubTypeId } = req.body;

        const updatedCashOfAccount = await prisma.cashOfAccount.update({
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

        res.json(updatedCashOfAccount);
    } catch (error) {
        console.error('Error updating cash of account:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function deleteCashOfAccount(req, res) {
    try {
        const { id } = req.params;

        await prisma.cashOfAccount.delete({
            where: {
                id,
            },
        });

        res.json({ message: 'Cash of account deleted successfully' });
    } catch (error) {
        console.error('Error deleting cash of account:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function getOneCashOfAccount(req, res) {
    try {
        const { id } = req.params;

        const cashOfAccount = await prisma.cashOfAccount.findUnique({
            where: {
                id,
            },
            include: {
                accountType: true,
                accountSubType: true,
            },
        });

        if (!cashOfAccount) {
            return res.status(404).json({ error: 'Cash of account not found' });
        }

        res.json(cashOfAccount);
    } catch (error) {
        console.error('Error fetching cash of account:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    getAllCashOfAccounts,
    createCashOfAccount,
    updateCashOfAccount,
    deleteCashOfAccount,
    getOneCashOfAccount
}
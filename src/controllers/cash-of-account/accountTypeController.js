const prisma = require("../../database");

async function createAccountType(req, res) {
    try{
        const { name } = req.body;

        const existingAccountType = await prisma.accountType.findFirst({
            where: {
                name: name,
            },
        });       

        if (existingAccountType) {
            return res.status(400).json({ error: 'Account type with this name already exists.' });
        }

        const createdAccountType = await prisma.accountType.create({
            data: {
                name,
            },include: {
                accountSubTypes: true,
            },
        });

        res.json(createdAccountType);
    }catch(error){
        console.error('Error creating account type:', error);
        res.status(500).send('Internal Server Error');
    }
}


async function getAccountTypeById(req, res) {
    try {
        const accountId = req.params.id;

        const accountType = await prisma.accountType.findUnique({
            where: {
                id: accountId,
            },
            include: {
                accountSubTypes: true
            }
        });

        if (!accountType) {
            return res.status(404).json({ error: 'Account type not found.' });
        }

        res.json(accountType);
    } catch (error) {
        console.error('Error fetching account type:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function updateAccountType(req, res) {
    try {
        const accountId = req.params.id;
        const { name } = req.body;

        const updatedAccountType = await prisma.accountType.update({
            where: {
                id: accountId,
            },
            data: {
                name,
            },
        });

        res.json(updatedAccountType);
    } catch (error) {
        console.error('Error updating account type:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function deleteAccountType(req, res) {
    try {
        const accountId = req.params.id;

        const deletedAccountType = await prisma.accountType.delete({
            where: {
                id: accountId,
            },
        });

        res.json(deletedAccountType);
    } catch (error) {
        console.error('Error deleting account type:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function getAllAccountTypes(req, res) {
    try {
        const allAccountTypes = await prisma.accountType.findMany({
            include: {
                accountSubTypes: true,
            },
        });

        res.json(allAccountTypes);
    } catch (error) {
        console.error('Error fetching all account types:', error);
        res.status(500).send('Internal Server Error');
    }
}


module.exports = {
    createAccountType,
    getAccountTypeById,
    updateAccountType,
    deleteAccountType,
    getAllAccountTypes
};
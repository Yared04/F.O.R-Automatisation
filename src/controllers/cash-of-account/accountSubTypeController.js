const prisma = require("../../database");

async function createAccountSubType(req, res) {
    try{
        const { name, accountTypeId } = req.body;

        const createdAccountSubType = await prisma.accountSubType.create({
            data: {
                name,
                accountTypeId
            }
        });

        res.json(createdAccountSubType);
    }catch(error){
        console.error('Error creating account type:', error);
        res.status(500).send('Internal Server Error');
    }
}


async function getAllAccountSubTypes(req, res) {
    try {
        const allAccountSubTypes = await prisma.accountSubType.findMany();

        res.json(allAccountSubTypes);
    } catch (error) {
        console.error('Error fetching all account sub types:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function getAccountSubTypeById(req, res) {
    try {
        const accountSubTypeId = req.params.id;

        const accountSubType = await prisma.accountSubType.findUnique({
            where: {
                id: accountSubTypeId,
            },
        });

        if (!accountSubType) {
            return res.status(404).json({ error: 'Account sub type not found.' });
        }

        res.json(accountSubType);
    } catch (error) {
        console.error('Error fetching account sub type:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function updateAccountSubType(req, res) {
    try {
        const accountSubTypeId = req.params.id;
        const { name, accountTypeId } = req.body;

        const updatedAccountSubType = await prisma.accountSubType.update({
            where: {
                id: accountSubTypeId,
            },
            data: {
                name,
                accountTypeId,
            },
        });

        res.json(updatedAccountSubType);
    } catch (error) {
        console.error('Error updating account sub type:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function deleteAccountSubType(req, res) {
    try {
        const accountSubTypeId = req.params.id;

        const deletedAccountSubType = await prisma.accountSubType.delete({
            where: {
                id: accountSubTypeId,
            },
        });

        res.json(deletedAccountSubType);
    } catch (error) {
        console.error('Error deleting account sub type:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    createAccountSubType,
    getAllAccountSubTypes,
    getAccountSubTypeById,
    updateAccountSubType,
    deleteAccountSubType,
};
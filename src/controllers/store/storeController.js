const prisma = require('../../database');

async function getStores(req, res) {
    try {
        const { page = 1, pageSize = 10 } = req.query;
        const totalCount = await prisma.store.count();
    
        const stores = await prisma.store.findMany({
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
        });
    
        const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));
    
        res.json({
        items: stores,
        totalCount: totalCount,
        pageSize: parseInt(pageSize, 10),
        currentPage: parseInt(page, 10),
        totalPages: totalPages,
        });
    
    } catch (error) {
        console.error('Error retrieving Stores:', error);
        res.status(500).send('Internal Server Error');
    }
    }

async function createStore(req, res) {
    try {
        const { name, address, phone } = req.body;
    
        const createdStore = await prisma.store.create({
        data: {
            name: name,
            address: address,
            phone: phone,
        }
        });
    
        res.json(createdStore);
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).send('Internal Server Error');
    }
    }


async function updateStore(req, res) {
    try {
        const storeId = parseInt(req.params.id);
        const { name, address, phone } = req.body;
    
        const updatedStore = await prisma.store.update({
        where: { id: storeId },
        data: {
            name: name,
            address: address,
            phone: phone,
        }
        });
    
        res.json(updatedStore);
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(500).send('Internal Server Error');
    }
    }

async function deleteStore(req, res) {
    try {
        const storeId = parseInt(req.params.id);
    
        await prisma.store.delete({
        where: { id: storeId },
        });
    
        res.json({ message: 'Store deleted successfully' });
    } catch (error) {
        console.error('Error deleting store:', error);
        res.status(500).send('Internal Server Error');
    }
    }

    async function getStoreById(req, res) {
        try {
            const storeId = parseInt(req.params.id);
        
            const store = await prisma.store.findUnique({
            where: { id: storeId },
            });
        
            res.json(store);
        } catch (error) {
            console.error('Error retrieving store:', error);
            res.status(500).send('Internal Server Error');
        }
        }


module.exports = {
    getStores,
    createStore,
    updateStore,
    deleteStore, 
    getStoreById
}
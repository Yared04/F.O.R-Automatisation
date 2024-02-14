const prisma = require('../../database');

async function getSuppliers(req, res) {
    try {
        const { page = 1, pageSize = 10 } = req.query;
        const totalCount = await prisma.supplier.count();
    
        const suppliers = await prisma.supplier.findMany({
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
        });
    
        const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));
    
        res.json({
        items: suppliers,
        totalCount: totalCount,
        pageSize: parseInt(pageSize, 10),
        currentPage: parseInt(page, 10),
        totalPages: totalPages,
        });
    
    } catch (error) {
        console.error('Error retrieving Suppliers:', error);
        res.status(500).send('Internal Server Error');
    }
    }

async function createSupplier(req, res) {
    try {
        const { name, address } = req.body;
    
        const createdSupplier = await prisma.supplier.create({
        data: {
            name,
            address,
        }
        });
    
        res.json(createdSupplier);
    } catch (error) {
        console.error('Error creating Supplier:', error);
        res.status(500).send('Internal Server Error');
    }
    }


async function updateSupplier(req, res) {
    try {
        const SupplierId = parseInt(req.params.id);
        const { name, address} = req.body;
    
        const updatedSupplier = await prisma.supplier.update({
        where: { id: SupplierId },
        data: {
            name: name,
            address: address,
        }
        });
    
        res.json(updatedSupplier);
    } catch (error) {
        console.error('Error updating Supplier:', error);
        res.status(500).send('Internal Server Error');
    }
    }

async function deleteSupplier(req, res) {
    try {
        const SupplierId = parseInt(req.params.id);
    
        await prisma.supplier.delete({
        where: { id: SupplierId },
        });
    
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting Supplier:', error);
        res.status(500).send('Internal Server Error');
    }
    }

    async function getSupplierById(req, res) {
        try {
            const SupplierId = parseInt(req.params.id);
        
            const Supplier = await prisma.supplier.findUnique({
            where: { id: SupplierId },
            });
        
            res.json(Supplier);
        } catch (error) {
            console.error('Error retrieving Supplier:', error);
            res.status(500).send('Internal Server Error');
        }
        }


module.exports = {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier, 
    getSupplierById
}
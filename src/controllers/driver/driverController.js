const prisma = require('../../database');

async function getDrivers(req, res) {
    try{
        const { page = 1, pageSize = 10 } = req.query;
        const totalCount = await prisma.driver.count();

        const drivers = await prisma.driver.findMany({
            select: {
                id: true,
                name: true,
                truckNumber: true,
                associationPhone: true,
                associationName: true,
                ownerName: true,
                ownerPhone: true,
                djboutiPhone: true,
                ethiopiaPhone: true,
                               
            },
            skip: (page - 1) * parseInt(pageSize, 10),
            take: parseInt(pageSize, 10)
        });

        const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

        res.json({
            items: drivers,
            totalCount: totalCount,
            pageSize: parseInt(pageSize, 10),
            currentPage: parseInt(page, 10),
            totalPages: totalPages
        });

    }catch(error){
        console.error('Error retrieving drivers:', error);
        res.status(500).send('Internal Server Error');
    }
};


async function createDriver(req, res) {
    try{
        const { name, truckNumber, associationPhone, associationName, ownerName, ownerPhone, djboutiPhone, ethiopiaPhone } = req.body;

        const createdDriver = await prisma.driver.create({
            data: {
                name,
                truckNumber,
                associationPhone,
                associationName,
                ownerName,
                ownerPhone,
                djboutiPhone,
                ethiopiaPhone
            }
        });

        res.json(createdDriver);
    }catch(error){
        console.error('Error creating driver:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function updateDriver(req, res) {
    try{
        const { id } = req.params;
        const { name, truckNumber, associationPhone, associationName, ownerName, ownerPhone, djboutiPhone, ethiopiaPhone } = req.body;

        const updatedDriver = await prisma.driver.update({
            where: { id: parseInt(id) },
            data: {
                name,
                truckNumber,
                associationPhone,
                associationName,
                ownerName,
                ownerPhone,
                djboutiPhone,
                ethiopiaPhone
            }
        });

        res.json(updatedDriver);
    }catch(error){
        console.error('Error updating driver:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function deleteDriver(req, res) {
    try{
        const { id } = req.params;

        const deletedDriver = await prisma.driver.delete({
            where: { id: parseInt(id) }
        });

        res.json(deletedDriver);
    }catch(error){
        console.error('Error deleting driver:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function getDriverById(req, res) {
    try{
        const { id } = req.params;

        const driver = await prisma.driver.findUnique({
            where: { id: parseInt(id) }
        });

        res.json(driver);
    }catch(error){
        console.error('Error retrieving driver:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    getDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    getDriverById
};
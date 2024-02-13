const bcrypt = require('bcrypt');
const jwtUtils = require('../../services/jwtUtils');
const prisma = require('../../database');

async function getCustomers(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.customer.count();

    const customers = await prisma.customer.findMany({
      skip: (page - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: customers,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });

  } catch (error) {
    console.error('Error retrieving Customers:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function createCustomer(req, res) {
  try {
    const { firstName, middleName, lastName, tinNumber, phone, address } = req.body;

    const createdcustomer = await prisma.customer.create({
      data: {
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        tinNumber: tinNumber,
        phone: phone,
        address: address
      }
    });

    res.json(createdcustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function updateCustomer(req, res) {
  try {
    const customerId = parseInt(req.params.id);
    const { firstName, middleName, lastName, tinNumber, phone, address } = req.body;

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        tinNumber: tinNumber,
        phone: phone,
        address: address
      }
    });

    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function deleteCustomer(req, res) {
  try {
    const customerId = parseInt(req.params.id);

    const deletedCustomer = await prisma.customer.delete({
      where: { id: customerId },
    });

    res.json(deletedCustomer);
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function getCustomerById(req, res) {
  try {
    const customerId = parseInt(req.params.id);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error retrieving customer:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
};
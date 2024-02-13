const prisma = require('../../database');

async function getRoles(req, res) {
  try {
    const roles = await prisma.role.findMany();

    res.json(roles);

  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = {
  getRoles
};
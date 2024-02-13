const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const roles = [
  { name: 'Admin' },
  { name: 'Accountant' },
  { name: 'Inventory Manager' },
  { name: 'Sales Manager' },
  { name: 'Purchase Manager' },
];

async function seedRoles() {
  const createdRoles = [];
  for (const role of roles) {
    const createdRole = await prisma.role.create({
      data: role,
    });
    createdRoles.push(createdRole);
  }
  return createdRoles;
}

const seedUser = async (roleId) => {
  const hashedPassword = await bcrypt.hash('12345', 10);

  await prisma.user.create({
    data: {
      userName: 'admin',
      roleId: roleId,
      password: hashedPassword,
    },
  });
};

async function main() {
  try {
    const createdRoles = await seedRoles();
    await seedUser(createdRoles[0].id);
    console.log('Seeded successfully.');
  } catch (error) {
    console.error('Error while seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

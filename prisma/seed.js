const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();

const roles = [
  { name: "Admin" },
  { name: "Accountant" },
  { name: "Inventory Manager" },
  { name: "Sales Manager" },
  { name: "Purchase Manager" },
];







async function seedAccountTypes() {
  const createdAccountTypes = [];
  const accountTypesFilePath = path.resolve(__dirname, 'accountTypes.json');
  const accountTypesData = await fs.readFile(accountTypesFilePath, 'utf-8');
  const accountTypes = JSON.parse(accountTypesData);
  for (const accountType of accountTypes) {
    const createdAccountType = await prisma.accountType.create({
      data: accountType,
    });
    createdAccountTypes.push(createdAccountType);
  }
  return createdAccountTypes;
}

async function seedAccountSubTypes() {
  const createdAccountSubTypes = [];
  const accountSubTypesFilePath = path.resolve(__dirname, 'accountSubTypes.json');
  const accountSubTypesData = await fs.readFile(accountSubTypesFilePath, 'utf-8');
  const accountSubTypes = JSON.parse(accountSubTypesData);
  for (const accountSubType of accountSubTypes) {
    const createdAccountSubType = await prisma.accountSubType.create({
      data: accountSubType,
    });
    createdAccountSubTypes.push(createdAccountSubType);
  }
  return createdAccountSubTypes;
}

async function seedChartOfAccounts() {
  const createdChartOfAccounts = [];
  const CAFullNameFilePath = path.resolve(__dirname, 'chartOfAccounts.json');
  const CAFullNameData = await fs.readFile(CAFullNameFilePath, 'utf-8');
  const CAFullName = JSON.parse(CAFullNameData);
  for (const chartOfAccount of CAFullName) {
    const createdChartOfAccount = await prisma.chartOfAccount.create({
      data: chartOfAccount,
    });
    createdChartOfAccounts.push(createdChartOfAccount);
  }
  return createdChartOfAccounts;
}

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
  const hashedPassword = await bcrypt.hash("12345", 10);

  await prisma.user.create({
    data: {
      userName: "admin",
      firstName: "Admin",
      lastName: "Admin",
      roleId: roleId,
      password: hashedPassword,
    },
  });
};

async function seedPermissions() {
  const createdPermissions = [];
  const permissionsFilePath = path.resolve(__dirname, 'permissions.json');
  const permissionsData = await fs.readFile(permissionsFilePath, 'utf-8');
  const permissions = JSON.parse(permissionsData);

  for (const permission of permissions) {
    const createdPermission = await prisma.permission.create({
      data: permission,
    });
    createdPermissions.push(createdPermission);
  }
  return createdPermissions;
}

async function main() {
  try {
    await seedAccountTypes();
    await seedAccountSubTypes();
    await seedChartOfAccounts();
    const createdRoles = await seedRoles();
    await seedUser(createdRoles[0].id);
    await seedPermissions()
    console.log("Seeded successfully.");
  } catch (error) {
    console.error("Error while seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

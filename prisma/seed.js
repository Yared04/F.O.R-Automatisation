const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const roles = [
  { name: "Admin" },
  { name: "Accountant" },
  { name: "Inventory Manager" },
  { name: "Sales Manager" },
  { name: "Purchase Manager" },
];

const accountSubTypes = [
  {
    name: "Current",
    id: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
  },
  {
    name: "Cash and cash equivalents",
    id: "09f5be2a-1436-4c89-985a-7f884bc4b2e0",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
  },
  {
    name: "Accounts Payable (A/P)",
    id: "dc65d736-c6fd-4569-b059-09a22ed49e3a",
    accountTypeId: "2bea0554-9e37-4c1f-bfd7-52e6f3b4e021",
  },
  {
    name: "Accounts Receivable (A/R)",
    id: "1631ee0a-36e5-4bb2-a16e-38b2a3da6958",
    accountTypeId: "1f94e15b-bb95-4419-a7d1-1ed7b7d9de6d",
  },
  {
    name: "Accrued liabilities",
    id: "c4957dcf-3c9e-419e-b88d-6c144a176019",
    accountTypeId: "4c845f5e-eb02-40d4-849a-87b1f10d0b4b",
  },
  {
    name: "Allowance for bad debts",
    id: "54a9e2b4-951b-4a58-93a2-3b0abbb88913",
    accountTypeId: "3d42e1c6-9216-4d68-9c48-f7a43c6c12e9",
  },
  {
    name: "Amortisation expense",
    id: "d9305f3c-f4c1-4347-809b-eb774fa6a051",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },

  {
    name: "Assets available for sale",
    id: "7f2f273f-8ae4-4aae-a900-5b179eb74d4b",
    accountTypeId: "b9bceaa1-06d5-4eeb-83a8-3e8c07d01e95",
  },
  {
    name: "Bad debts",
    id: "f7cbde2e-01a6-4424-a07a-85ac91d8e10b",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Charitable Contributions",
    id: "de8f93d5-9ef6-47d5-b849-f75e1f39e905",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Bank charges",
    id: "511d2a78-b2f5-4146-836f-7987c16982cb",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Supplies and materials - COS",
    id: "451d4a25-3444-472f-a78c-bc7f7ae0fd7c",
    accountTypeId: "6e15b6d8-8aa0-4e2b-bc1d-b5fe0b432b48",
  },
  {
    name: "Commissions and fees",
    id: "cf69ee39-f93e-4e30-8514-dca84940bf9b",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Taxes Paid",
    id: "07d22d9f-88e2-41b7-a56a-09b5c1809c94",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Discounts/Refunds Given",
    id: "e12e3ad2-62b1-4e2c-861d-64c4bcf89405",
    accountTypeId: "7bc65403-f50f-4991-a1d3-d377005f84d8",
  },
  {
    name: "Dividend disbursed",
    id: "e1eeb450-f007-4481-b6b2-32a89d4c8574",
    accountTypeId: "8e23d3d3-44f4-456a-8bc7-129d1c15aaee",
  },
  {
    name: "Shipping and delivery expense",
    id: "c72fd0e5-cce4-4d4f-8567-1dc3345c2b4d",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Exchange Gain or Loss",
    id: "be8b4871-6b69-4592-87e8-707ca1251f39",
    accountTypeId: "9b5f8a9b-4b5f-49f4-ba6c-07a40f72ae48",
  },
  {
    name: "Income tax expense",
    id: "ce70e7f0-0ba5-463d-9e6d-efbb51e7a4fc",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Income tax payable",
    id: "25c9cb45-55c5-4b2d-834e-4e7d067a5734",
    accountTypeId: "4c845f5e-eb02-40d4-849a-87b1f10d0b4b",
  },
  {
    name: "Insurance",
    id: "aa6abdd7-fca2-4d18-98e4-97c20552c24d",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Interest earned",
    id: "02e12f6b-9262-4b68-a528-56a3071ae12b",
    accountTypeId: "a8b2c827-889c-41c4-b299-64c1862ae2ab",
  },
  {
    name: "Inventory",
    id: "8f23f11e-d13c-4ac0-8b8b-1b82f3e6c3ad",
    accountTypeId: "3d42e1c6-9216-4d68-9c48-f7a43c6c12e9",
  },
  {
    name: "Legal and professional fees",
    id: "c6e72259-baf6-437b-b579-72b8d7ef00d4",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Cost of Labour",
    id: "9e883d81-85d6-4fe9-b8d2-6e405d9921aa",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Loan Payable",
    id: "0a5826c9-6660-4d45-87db-9debb4df9c77",
    accountTypeId: "4c845f5e-eb02-40d4-849a-87b1f10d0b4b",
  },
  {
    name: "Meals and entertainment",
    id: "3c8be1d3-7a63-46c5-aa3e-e90f32c7897d",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Office/General Administrative Expenses",
    id: "91d9fcb3-793d-4988-abe4-d72a5e02d3f8",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Other Expense",
    id: "df046b32-d6ab-47c5-9c11-d90df7f2d125",
    accountTypeId: "9b5f8a9b-4b5f-49f4-ba6c-07a40f72ae48",
  },
  {
    name: "Opening Balance Equity",
    id: "d8a6daa6-51e9-42e1-9910-91e472c5bcb2",
    accountTypeId: "8e23d3d3-44f4-456a-8bc7-129d1c15aaee",
  },
  {
    name: "Advertising/Promotional",
    id: "98ec2f35-185a-4909-bd82-f72a2ba52e48",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Other non-current assets",
    id: "34512b1b-4f70-4c42-a4e0-fec5d598b6ac",
    accountTypeId: "b9bceaa1-06d5-4eeb-83a8-3e8c07d01e95",
  },
  {
    name: "Supplies and materials",
    id: "af3b3dd6-2c6e-4fc4-bef7-13087a71ff2d",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Loans to Others",
    id: "4a6b501c-56b2-45bb-9e27-24c60c028418",
    accountTypeId: "4c845f5e-eb02-40d4-849a-87b1f10d0b4b",
  },
  {
    name: "Rent or Lease of Buildings",
    id: "1abfe2e6-d65e-4a6a-92e9-c1a54e1f8a1d",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Repair and maintenance",
    id: "77a20c5e-bf1c-47e2-ba60-5c4b94db78b6",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Retained Earnings",
    id: "0b3ed0d2-64a7-4b17-89dc-2f4f54664d5f",
    accountTypeId: "8e23d3d3-44f4-456a-8bc7-129d1c15aaee",
  },
  {
    name: "Sales of Product Income",
    id: "ab0b0731-9a33-4b4e-8fb4-cfa37eaf0ef5",
    accountTypeId: "7bc65403-f50f-4991-a1d3-d377005f84d8",
  },
  {
    name: "Share capital",
    id: "48b27605-49e1-409b-b201-4a0985b369c0",
    accountTypeId: "8e23d3d3-44f4-456a-8bc7-129d1c15aaee",
  },
  {
    name: "Payroll Expenses",
    id: "1b9a5abf-ae47-46f4-92fc-5f77d9b1e9ef",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
  {
    name: "Travel expenses - general and admin expenses",
    id: "be6e62b5-2649-4b8d-8988-802d202af9d4",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
  },
];

const accountTypes = [
  { name: "Bank", id: "05e94538-3700-42de-a5ab-89c663aa8575" },
  {
    name: "Accounts Receivable(A/R)",
    id: "1f94e15b-bb95-4419-a7d1-1ed7b7d9de6d",
  },
  { name: "Accounts Payable(A/P)", id: "2bea0554-9e37-4c1f-bfd7-52e6f3b4e021" },
  { name: "Other Current Assets", id: "3d42e1c6-9216-4d68-9c48-f7a43c6c12e9" },
  {
    name: "Other Current Liabilities",
    id: "4c845f5e-eb02-40d4-849a-87b1f10d0b4b",
  },
  { name: "Expenses", id: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565" },
  { name: "Cost of Goods Sold", id: "6e15b6d8-8aa0-4e2b-bc1d-b5fe0b432b48" },
  { name: "Income", id: "7bc65403-f50f-4991-a1d3-d377005f84d8" },
  { name: "Equity", id: "8e23d3d3-44f4-456a-8bc7-129d1c15aaee" },
  { name: "Other Expenses", id: "9b5f8a9b-4b5f-49f4-ba6c-07a40f72ae48" },
  { name: "Other Income", id: "a8b2c827-889c-41c4-b299-64c1862ae2ab" },
  { name: "Other Assets", id: "b9bceaa1-06d5-4eeb-83a8-3e8c07d01e95" },
];

const CAFullName = [
  {
    name: "Bridging Bank Account",
    id: "a51a13e7-6b18-43bc-93b0-022a146aeb4b",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Cashier F.O.R",
    id: "f7a6a19d-5c2c-4d45-b9e5-5dfb32ad79dc",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Fouad Abysinia02",
    id: "cf26c2e6-13c2-4e29-8d1f-cb0d184343c7",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Fouad Abysinia77",
    id: "ff932b7e-06c3-4e0d-8a6d-b56a0e6abf28",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "FOUAD AWASH",
    id: "f124bb40-27b8-4e41-9d08-bf70c70d0009",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "FOUAD CBE",
    id: "91f0d24f-218e-4709-8590-b214af6e4c5d",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Fouad Coop",
    id: "aa84b7c7-267d-49a5-ae80-3d4f34e2e769",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Fouad Dashen",
    id: "28c556c8-aa01-48a0-a55d-8909e9e5e3aa",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Fouad Nib",
    id: "72f09dcb-cf97-4f9c-b1fd-20e62e729358",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Fouad OIB",
    id: "c3a1c9b8-4e34-47b8-88e6-70b81cc7974b",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Fouad Siinqee C/A",
    id: "d5be1c45-d6f3-4515-bdd2-9ac5eef51385",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Fouad Siinqee R/A",
    id: "d8e4fb47-66a7-4c12-b90d-9d1d7fc893f7",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "FOUAD ZEMEN C/A",
    id: "f3f3819f-5a2b-4d4f-92d8-6ecf7b03f0a5",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "FOUAD Zemen D/A",
    id: "f8b3b6b1-8b23-4b84-8365-318c1e1d04b0",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "FOUAD ZEMEN R/A",
    id: "ef25f918-ee30-4f47-b281-00f4bc1cf2c7",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Messay Bunna",
    id: "540c6890-4e2e-4cbf-9a7f-4da9e29c36d7",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Messay CBE Mobile",
    id: "1a2a5e6b-6549-4f3e-90ab-85a2737c5051",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Muktar NIB",
    id: "ea389293-4f0a-4d3d-b747-14f55b8c5b38",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Muktar Oromia International",
    id: "784c5f77-ae2a-4b3e-8587-0abff5967a79",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "d3a09df7-eebc-4195-a293-fa1fbbf8dab5",
  },
  {
    name: "Petty Cash",
    id: "2a156743-7769-45e3-b246-79273eb9b3d3",
    accountTypeId: "05e94538-3700-42de-a5ab-89c663aa8575",
    accountSubTypeId: "09f5be2a-1436-4c89-985a-7f884bc4b2e0",
  },
  {
    name: "Accounts Payable (A/P) - ETB",
    id: "b27fa892-2a1f-429b-872d-8c004a303bd8",
    accountTypeId: "2bea0554-9e37-4c1f-bfd7-52e6f3b4e021",
    accountSubTypeId: "dc65d736-c6fd-4569-b059-09a22ed49e3a",
  },
  {
    name: "Accounts Payable (A/P) - USD",
    id: "9145a724-1650-4416-bbcf-f1e1ac3619e5",
    accountTypeId: "2bea0554-9e37-4c1f-bfd7-52e6f3b4e021",
    accountSubTypeId: "dc65d736-c6fd-4569-b059-09a22ed49e3a",
  },
  {
    name: "Accounts Receivable (A/R)",
    id: "6e57436a-8c19-426a-a260-f8fc5e6de0e1",
    accountTypeId: "1f94e15b-bb95-4419-a7d1-1ed7b7d9de6d",
    accountSubTypeId: "1631ee0a-36e5-4bb2-a16e-38b2a3da6958",
  },
  {
    name: "Accrued liabilities",
    id: "b15c1343-bc15-4b02-a63b-06f9bfca06c2",
    accountTypeId: "4c845f5e-eb02-40d4-849a-87b1f10d0b4b",
    accountSubTypeId: "c4957dcf-3c9e-419e-b88d-6c144a176019",
  },
  {
    name: "Allowance for bad debt",
    id: "c730c44d-dbb7-49ed-9967-d63690a7c248",
    accountTypeId: "3d42e1c6-9216-4d68-9c48-f7a43c6c12e9",
    accountSubTypeId: "54a9e2b4-951b-4a58-93a2-3b0abbb88913",
  },
  {
    name: "Amortisation expense",
    id: "4b4d0c14-c7d5-46c3-9dcf-682e9e5b7d9d",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "d9305f3c-f4c1-4347-809b-eb774fa6a051",
  },
  {
    name: "Available for sale assets (short-term)",
    id: "c29fcbee-38db-4228-a03a-ee63217c94f7",
    accountTypeId: "3d42e1c6-9216-4d68-9c48-f7a43c6c12e9",
    accountSubTypeId: "7f2f273f-8ae4-4aae-a900-5b179eb74d4b",
  },
  {
    name: "Bad debts",
    id: "094ff9de-4b0b-4045-9a9e-703e39e823c5",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "f7cbde2e-01a6-4424-a07a-85ac91d8e10b",
  },
  {
    name: "Bakshish Bank Permit",
    id: "39e3e979-5df5-47e7-99d2-451f2b05f22f",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "de8f93d5-9ef6-47d5-b849-f75e1f39e905",
  },
  {
    name: "Bank charges",
    id: "ab62c539-1559-41e8-91d0-41eabe40f4f7",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "511d2a78-b2f5-4146-836f-7987c16982cb",
  },
  {
    name: "Charity Fees - Bakshish",
    id: "e48a2c07-9da6-4b6b-8a43-48423d292e7b",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "de8f93d5-9ef6-47d5-b849-f75e1f39e905",
  },
  {
    name: "COGS Cumulated",
    id: "755f2ef2-4ed4-42a0-9f4c-0768036863e2",
    accountTypeId: "6e15b6d8-8aa0-4e2b-bc1d-b5fe0b432b48",
    accountSubTypeId: "451d4a25-3444-472f-a78c-bc7f7ae0fd7c",
  },
  {
    name: "Commissions and fees",
    id: "3db270fb-505d-4f6d-8c74-7f270e95e05a",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "cf69ee39-f93e-4e30-8514-dca84940bf9b",
  },
  {
    name: "Cost of sales",
    id: "e89567ac-44f0-4b45-810d-9e66c1294bc0",
    accountTypeId: "6e15b6d8-8aa0-4e2b-bc1d-b5fe0b432b48",
    accountSubTypeId: "451d4a25-3444-472f-a78c-bc7f7ae0fd7c",
  },
  {
    name: "Custom Taxes",
    id: "bfaf2b10-dc89-4ad2-8c77-d75d29b5eaf0",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "07d22d9f-88e2-41b7-a56a-09b5c1809c94",
  },
  {
    name: "Discounts given",
    id: "b8049bcf-07a9-4c52-88e0-eb37f00b1c2c",
    accountTypeId: "7bc65403-f50f-4991-a1d3-d377005f84d8",
    accountSubTypeId: "e12e3ad2-62b1-4e2c-861d-64c4bcf89405",
  },
  {
    name: "Dividend disbursed",
    id: "ba5db6cf-68da-4486-9c97-350916e8a1c8",
    accountTypeId: "8e23d3d3-44f4-456a-8bc7-129d1c15aaee",
    accountSubTypeId: "e1eeb450-f007-4481-b6b2-32a89d4c8574",
  },
  {
    name: "ESL Custom Warehouse",
    id: "9e109146-6492-4f0a-837e-81c402e34f58",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "c72fd0e5-cce4-4d4f-8567-1dc3345c2b4d",
  },
  {
    name: "Exchange Gain or Loss",
    id: "bcb5ec76-c438-494b-82a3-7724605e70f1",
    accountTypeId: "9b5f8a9b-4b5f-49f4-ba6c-07a40f72ae48",
    accountSubTypeId: "be8b4871-6b69-4592-87e8-707ca1251f39",
  },
  {
    name: "Import Transport Bakshish",
    id: "cb5bc1e5-0dc5-476a-9038-11f963be1200",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "c72fd0e5-cce4-4d4f-8567-1dc3345c2b4d",
  },
  {
    name: "Import Transport Cost",
    id: "3f2d5f0e-7ac4-4fd4-b4b6-bf7ae1f05f4c",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "c72fd0e5-cce4-4d4f-8567-1dc3345c2b4d",
  },
  {
    name: "Import Transport Demurrage",
    id: "bc34d975-fc8d-40fd-b8c3-9cfeba1f0f2e",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "c72fd0e5-cce4-4d4f-8567-1dc3345c2b4d",
  },
  {
    name: "Income tax expense",
    id: "f6c5a1f3-3727-4f6b-857f-95f276f0f47f",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "ce70e7f0-0ba5-463d-9e6d-efbb51e7a4fc",
  },
  {
    name: "Income tax payable",
    id: "d9ad8e82-6e6c-442a-91d1-c6c6a3c81032",
    accountTypeId: "4c845f5e-eb02-40d4-849a-87b1f10d0b4b",
    accountSubTypeId: "25c9cb45-55c5-4b2d-834e-4e7d067a5734",
  },
  {
    name: "Insurance - General",
    id: "da467fbf-b334-4f09-8962-5d81a03877cb",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "aa6abdd7-fca2-4d18-98e4-97c20552c24d",
  },
  {
    name: "Interest income",
    id: "af6b0058-2d02-4387-8e3e-5829b81a5cb5",
    accountTypeId: "a8b2c827-889c-41c4-b299-64c1862ae2ab",
    accountSubTypeId: "02e12f6b-9262-4b68-a528-56a3071ae12b",
  },
  {
    name: "Inventory Asset",
    id: "a0fc9f57-7a97-49d7-8b43-2a1f4d54669d",
    accountTypeId: "3d42e1c6-9216-4d68-9c48-f7a43c6c12e9",
    accountSubTypeId: "8f23f11e-d13c-4ac0-8b8b-1b82f3e6c3ad",
  },
  {
    name: "Inventory Shrinkage",
    id: "0d84faa4-78f8-4ba1-9f47-8053e9c15dd1",
    accountTypeId: "6e15b6d8-8aa0-4e2b-bc1d-b5fe0b432b48",
    accountSubTypeId: "451d4a25-3444-472f-a78c-bc7f7ae0fd7c",
  },
  {
    name: "Legal and-or Consultancy fees",
    id: "5b1a7b77-4984-4d92-b96f-1c42a0b1f9de",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "c6e72259-baf6-437b-b579-72b8d7ef00d4",
  },
  {
    name: "Loading and Unloading",
    id: "7d18d541-f83a-4543-8756-d76af86db168",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "9e883d81-85d6-4fe9-b8d2-6e405d9921aa",
  },
  {
    name: "Loan from Djib Customers",
    id: "d676dc16-ec8e-403f-8499-eaf67e94bb09",
    accountTypeId: "4c845f5e-eb02-40d4-849a-87b1f10d0b4b",
    accountSubTypeId: "0a5826c9-6660-4d45-87db-9debb4df9c77",
  },
  {
    name: "Loan From-To Others",
    id: "7c1a3d62-00e0-4145-bbb7-649c2c6ad70d",
    accountTypeId: "4c845f5e-eb02-40d4-849a-87b1f10d0b4b",
    accountSubTypeId: "0a5826c9-6660-4d45-87db-9debb4df9c77",
  },
  {
    name: "Marine cargo insurance",
    id: "550bc0b1-c065-41a0-ae5d-0481d2c47c48",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "aa6abdd7-fca2-4d18-98e4-97c20552c24d",
  },
  {
    name: "Meals and entertainment",
    id: "aa9b4205-7b5a-4545-bf9e-501187ebe1c5",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "3c8be1d3-7a63-46c5-aa3e-e90f32c7897d",
  },
  {
    name: "Office expenses",
    id: "3c88fb12-73cf-4633-af41-12bae7b9c8c5",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "91d9fcb3-793d-4988-abe4-d72a5e02d3f8",
  },
  {
    name: "Office Transport Cost",
    id: "51f7e6bc-1d64-4e89-8cbb-087a74048824",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "c72fd0e5-cce4-4d4f-8567-1dc3345c2b4d",
  },
  {
    name: "Opening Balance",
    id: "17c4c929-d858-4841-bf5c-e1c17a848c95",
    accountTypeId: "9b5f8a9b-4b5f-49f4-ba6c-07a40f72ae48",
    accountSubTypeId: "df046b32-d6ab-47c5-9c11-d90df7f2d125",
  },
  {
    name: "Opening Balance Equity",
    id: "a5545d1b-bcf7-4460-8c47-9f7f1534ef1f",
    accountTypeId: "8e23d3d3-44f4-456a-8bc7-129d1c15aaee",
    accountSubTypeId: "d8a6daa6-51e9-42e1-9910-91e472c5bcb2",
  },
  {
    name: "Other general and administrative expenses",
    id: "f3640d65-91db-4651-856a-2ddcbddaa971",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "91d9fcb3-793d-4988-abe4-d72a5e02d3f8",
  },
  {
    name: "Other Types of Expenses-Advertising Expenses",
    id: "f1998d62-3bcf-4b54-95c3-5f50a1e50e10",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "98ec2f35-185a-4909-bd82-f72a2ba52e48",
  },
  {
    name: "Other Expenses",
    id: "2dd21544-6752-4fc7-af6a-b76e98f79395",
    accountTypeId: "9b5f8a9b-4b5f-49f4-ba6c-07a40f72ae48",
    accountSubTypeId: "df046b32-d6ab-47c5-9c11-d90df7f2d125",
  },
  {
    name: "Payroll Expenses",
    id: "2e3b4051-13d8-4e97-bd64-7dd836b6f38f",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "91d9fcb3-793d-4988-abe4-d72a5e02d3f8",
  },
  {
    name: "Provision for ESL Fees",
    id: "675cc2b8-7aa6-4c05-a5c3-b6f7af39e176",
    accountTypeId: "b9bceaa1-06d5-4eeb-83a8-3e8c07d01e95",
    accountSubTypeId: "34512b1b-4f70-4c42-a4e0-fec5d598b6ac",
  },
  {
    name: "Provision for Import Taxes",
    id: "18be65c8-43f3-4781-9e3d-e003d9a1c81b",
    accountTypeId: "b9bceaa1-06d5-4eeb-83a8-3e8c07d01e95",
    accountSubTypeId: "34512b1b-4f70-4c42-a4e0-fec5d598b6ac",
  },
  {
    name: "Provision for Rental Warhouse/Office",
    id: "e16c56f1-7577-4182-bc92-1e2ae4c545b4",
    accountTypeId: "b9bceaa1-06d5-4eeb-83a8-3e8c07d01e95",
    accountSubTypeId: "34512b1b-4f70-4c42-a4e0-fec5d598b6ac",
  },
  {
    name: "Provision for Transit Fees",
    id: "37786d0a-b20a-46ed-a0a1-72c25d03a170",
    accountTypeId: "b9bceaa1-06d5-4eeb-83a8-3e8c07d01e95",
    accountSubTypeId: "34512b1b-4f70-4c42-a4e0-fec5d598b6ac",
  },
  {
    name: "Provision for Transport Fees",
    id: "46ae3e1f-573d-44d3-b04e-1a41a0a4c0a2",
    accountTypeId: "b9bceaa1-06d5-4eeb-83a8-3e8c07d01e95",
    accountSubTypeId: "34512b1b-4f70-4c42-a4e0-fec5d598b6ac",
  },
  {
    name: "Purchases",
    id: "c2cf9fc8-f59b-4d6b-b09d-d3126da21fd1",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "af3b3dd6-2c6e-4fc4-bef7-13087a71ff2d",
  },
  {
    name: "Reconciliation Discrepancies",
    id: "0a65fc0e-6069-4d94-a5d4-20fcf1c35b86",
    accountTypeId: "9b5f8a9b-4b5f-49f4-ba6c-07a40f72ae48",
    accountSubTypeId: "df046b32-d6ab-47c5-9c11-d90df7f2d125",
  },
  {
    name: "Refund / Return",
    id: "0b8f3a5c-d700-49ff-b00f-09514b68285b",
    accountTypeId: "3d42e1c6-9216-4d68-9c48-f7a43c6c12e9",
    accountSubTypeId: "4a6b501c-56b2-45bb-9e27-24c60c028418",
  },
  {
    name: "Rent or lease payments",
    id: "dd24f7c0-fb9b-4fe3-82e1-ec0721e8dc0e",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "1abfe2e6-d65e-4a6a-92e9-c1a54e1f8a1d",
  },
  {
    name: "Repairs and Maintenance",
    id: "05a3fc51-12c6-4c41-81c2-f90e499f4627",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "77a20c5e-bf1c-47e2-ba60-5c4b94db78b6",
  },
  {
    name: "Retained Earnings",
    id: "75e2f9b1-fdbe-4904-9e90-5cf3d43df50a",
    accountTypeId: "8e23d3d3-44f4-456a-8bc7-129d1c15aaee",
    accountSubTypeId: "0b3ed0d2-64a7-4b17-89dc-2f4f54664d5f",
  },
  {
    name: "Sales of Product Income",
    id: "6827d1d2-4706-46f5-bd07-4586c27088a0",
    accountTypeId: "7bc65403-f50f-4991-a1d3-d377005f84d8",
    accountSubTypeId: "ab0b0731-9a33-4b4e-8fb4-cfa37eaf0ef5",
  },
  {
    name: "Sales Transport Cost",
    id: "c3801dc2-9b69-4c8e-a152-96c3b8489a0b",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "c72fd0e5-cce4-4d4f-8567-1dc3345c2b4d",
  },
  {
    name: "Share capital",
    id: "a4e88cd9-f7e4-4888-83c2-b8a1a5c3c6a8",
    accountTypeId: "8e23d3d3-44f4-456a-8bc7-129d1c15aaee",
    accountSubTypeId: "48b27605-49e1-409b-b201-4a0985b369c0",
  },
  {
    name: "Shipping and delivery expense",
    id: "c97fe88b-2754-4a06-baa2-9a61bf2f5eef",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "c72fd0e5-cce4-4d4f-8567-1dc3345c2b4d",
  },
  {
    name: "Staff Telephone Allowance",
    id: "71cb9cf3-1257-4d3a-bd16-d619d85d3f11",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "1b9a5abf-ae47-46f4-92fc-5f77d9b1e9ef",
  },
  {
    name: "Staff Transport Allowance",
    id: "dcf25e56-c3e4-4504-bc42-8a32c8fc45ef",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "1b9a5abf-ae47-46f4-92fc-5f77d9b1e9ef",
  },
  {
    name: "Stationery and printing",
    id: "a6190d94-2c56-4b79-86c1-64bc1592f08e",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "91d9fcb3-793d-4988-abe4-d72a5e02d3f8",
  },
  {
    name: "Transit fees",
    id: "01a48436-4e8c-451f-b6d3-7761dd70f7d4",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "c72fd0e5-cce4-4d4f-8567-1dc3345c2b4d",
  },
  {
    name: "Travel expenses - general and admin expenses",
    id: "57d02870-cb11-4ff5-967f-3a248c0de3c7",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "be6e62b5-2649-4b8d-8988-802d202af9d4",
  },
  {
    name: "Warehouse Expense",
    id: "cc03f4cd-eead-4433-aa9c-019ad7fb67d2",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "af3b3dd6-2c6e-4fc4-bef7-13087a71ff2d",
  },
  {
    name: "Yearly License Renewal Expenses",
    id: "0094ec0c-8e2b-4411-995d-7ab7e3fd4b26",
    accountTypeId: "5a71d6d4-cc3b-4780-a3d7-5fc1fbdd8565",
    accountSubTypeId: "07d22d9f-88e2-41b7-a56a-09b5c1809c94",
  },
];


async function seedAccountTypes() {
  const createdAccountTypes = [];
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
      roleId: roleId,
      password: hashedPassword,
    },
  });
};

async function main() {
  try {
    await seedAccountTypes();
    await seedAccountSubTypes();
    await seedChartOfAccounts();
    const createdRoles = await seedRoles();
    await seedUser(createdRoles[0].id);
    console.log("Seeded successfully.");
  } catch (error) {
    console.error("Error while seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

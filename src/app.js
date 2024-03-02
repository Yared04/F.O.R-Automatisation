const express = require("express");
const userRoutes = require("./routes/auth/useRoutes");
const roleRoutes = require("./routes/auth/roleRoutes");
const customerRoutes = require("./routes/customer/customerRoutes");
const driverRoutes = require("./routes/driver/driverRoutes");
const productRoutes = require("./routes/product/productRoutes");
const storeRoutes = require("./routes/store/storeRoutes");
const supplierRoutes = require("./routes/supplier/supplierRoutes");
const declarationRoutes = require("./routes/declaration/declarationRoutes");
const purchaseRoutes = require("./routes/purchase/purchaseRoutes");
const inventoryRoutes = require("./routes/inventory/inventoryRoutes");
const saleRoutes = require("./routes/sales/salesRoutes");
const accountTypeRoutes = require("./routes/cash-of-account/accountTypeRoutes");
const accountSubTypeRoutes = require("./routes/cash-of-account/accountSubTypeRoutes");
const cashOfAccountRoutes = require("./routes/cash-of-account/cashOfAccountRoutes");
const caTransactionRoutes = require("./routes/caTransaction/caTransactionRoutes");
const dashboardRoutes = require("./routes/dashboard/dashboardRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const cors = require("cors");

const app = express();
app.use(cors());

app.use(express.json());
app.use("/api", userRoutes);
app.use("/api", roleRoutes);
app.use("/api", productRoutes);
app.use("/api", customerRoutes);
app.use("/api", storeRoutes);
app.use("/api", supplierRoutes);
app.use("/api", declarationRoutes);
app.use("/api", purchaseRoutes);
app.use("/api", saleRoutes);
app.use("/api", driverRoutes);
app.use("/api", accountTypeRoutes);
app.use("/api", accountSubTypeRoutes);
app.use("/api", cashOfAccountRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", caTransactionRoutes);
app.use("/api", dashboardRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;

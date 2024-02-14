const express = require('express');
const userRoutes = require('./routes/auth/useRoutes');
const roleRoutes = require('./routes/auth/roleRoutes');
const customerRoutes = require('./routes/sales/customerRoutes');
const driverRoutes = require('./routes/driver/driverRoutes');
const productRoutes = require('./routes/product/productRoutes');
const storeRoutes = require('./routes/store/storeRoutes');
const supplierRoutes = require('./routes/supplier/supplierRoutes');
const declarationRoutes =  require('./routes/declaration/declarationRoutes')
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); 
const cors = require('cors');


const app = express();
app.use(cors());

app.use(express.json());
app.use('/api', userRoutes);
app.use('/api', roleRoutes);
app.use('/api', productRoutes);
app.use('/api', customerRoutes);
app.use('/api', storeRoutes);
app.use('/api', supplierRoutes);
app.use('/api', declarationRoutes);

app.use('/api', driverRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;

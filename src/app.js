const express = require('express');
const userRoutes = require('./routes/auth/useRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); 
const cors = require('cors');


const app = express();
app.use(cors());

app.use(express.json());
app.use('/api', userRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;

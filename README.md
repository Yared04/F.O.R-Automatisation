Web app - https://github.com/kalish93/inventory-react-client

#### **Project Setup**

1. **Clone the repository:** git clone

2. **Install dependencies:** npm install

3. **Set up the .env file with DATABASE_URL pointing to your PostgreSQL database.**

4. **Run migrations and seed the database:**

- Run migrations for the first time: npx prisma migrate dev --name initial

- Seed the database: node prisma/seed.js

5. **Start the backend server:** npm start

#### **Environment Configuration**

1.  **Create a .env file in the root directory.**
2.  **Set the following environment variables:**

    - DATABASE_URL: Set this to the correct value for your PostgreSQL database (either local or hosted on platforms like onRender).

#### **Additional Notes**

- Make sure to set up a PostgreSQL database either locally or using a cloud service like onRender.

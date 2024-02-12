module.exports = {
    HOST: "localhost",
    USER: "Yared",
    PASSWORD: "12345678",
    DB: "F.O.R",
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
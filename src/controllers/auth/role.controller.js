const db = require("../../models");
const Role = db.role;
const Permission = db.permission;
const Op = db.Sequelize.Op;


// Create and Save a new Role
exports.create = (req, res) => {
  // Validate request
  if (!req.body.roleName) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  // Create a Role
  const role = {
    roleName: req.body.roleName,
  };

  // Save Role in the database
  Role.create(role)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Role.",
      });
    });
};
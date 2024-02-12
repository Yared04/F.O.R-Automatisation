module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define("roles", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },
  });

  Role.associate = (models) => {
    Role.hasMany(models.users, {
      foreignKey: "roleId",
    });
    Role.belongsToMany(models.permission, {
      through: "RolePermission",
      foreignKey: "roleId",
    });
  };

  return Role;
};

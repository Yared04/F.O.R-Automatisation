module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("users", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    username: {
      allowNull: false,
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },
    password: {
      allowNull: false,
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },
  });

  User.associate = (models) => {
    User.belongsTo(models.role, {
      foreignKey: "roleId",
    });

    User.associate = (models => {
        User.belongsToMany(models.permission, {
            through: "UserPermission",
            foreignKey: "userId",
        });
    });
  };

  return User;
};

module.exports = (sequelize, DataTypes) => {
  const RolePermission = sequelize.define("role_permission", {
    roleId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      references: {
        model: "role",
        key: "roleId",
      },
    },
    permissionId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      references: {
        model: "permission",
        key: "permissionId",
      },
    },
  });
  return RolePermission;
};

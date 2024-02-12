module.exports = (sequelize, DataTypes) => {
    const Permission = sequelize.define("permissions", {
        permissionId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        },
        accessLevel: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
            notEmpty: true,
        },
        },
    });

    Permission.associate = (models) => {
        Permission.belongsToMany(models.role, {
            through: "RolePermission",
            foreignKey: "permissionId",
        });
        Permission.belongsToMany(models.user, {
            through: "UserPermission",
            foreignKey: "permissionId",
        });
    }
    return Permission;
};


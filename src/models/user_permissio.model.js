module.exports = (sequelize, DataTypes) => {
    const UserPermission = sequelize.define("user_permission", {
        userId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
            model: "user",
            key: "userId",
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

    return UserPermission;
};
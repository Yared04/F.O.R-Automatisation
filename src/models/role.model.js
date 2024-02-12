module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define("roles", {
        roleId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        },
        roleName: {
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
        })
    }
    
    return Role;
    };
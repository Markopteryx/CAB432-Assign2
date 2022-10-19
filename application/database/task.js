const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Task extends Model {}

  Task.init({
    // Model attributes are defined here
    frameID: {
      type: DataTypes.STRING,
    },
    renderID: {
      type: DataTypes.STRING,
      allowNull: false
    },
    completeStatus: {
      type: DataTypes.STRING,
      defaultValue: false
    },
    frameURL: {
      type: DataTypes.STRING
    },
    frame: {
      type: DataTypes.INTEGER,
    }
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'Task' // We need to choose the model name
  });
  return Task;
};
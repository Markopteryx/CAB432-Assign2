const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Render extends Model {}

  Render.init({
    // Model attributes are defined here
    renderID: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    blendFile: {
      type: DataTypes.STRING,
      allowNull: false
    },
    renderDone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    renderType: {
      type: DataTypes.ENUM("Image", "Video")
    },
    framesCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalFrames: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'Render' // We need to choose the model name
  });
  return Render;
};
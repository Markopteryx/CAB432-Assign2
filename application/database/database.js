require('dotenv').config();
const { Sequelize, QueryInterface } = require('sequelize');

var Render = require('./render')
var Task = require('./task')

const DB_HOST = process.env.DB_HOST
const DB_DATABASE = process.env.DB_DATABASE
const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD 

const sequelize = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
    dialect: 'mysql',
    dialectOptions: {
      host: DB_HOST,
      user: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_DATABASE
    }
})

Task(sequelize)
Render(sequelize)

console.log(typeof(sequelize.models.Task))

sequelize.models.Task.belongsTo(Render, {as: 'renderID', foreignKey: {allowNull: false, name: 'renderID'}})
sequelize.models.Render.hasMany(Task, {as: 'frameList', foreignKey: {allowNull: false, name: 'renderID'}})

QueryInterface.addConstraint('Task', {
    fields: ['renderID', 'taskID'],
    type: 'primary key',
    name: 'frameKey'
})

module.exports = sequelize
require('dotenv').config();
const { Sequelize, QueryInterface } = require('sequelize');

var Render = require('./render')
var Frame = require('./frame')

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
    },
    logging:false
})

var frame_ = Frame(sequelize)
var render_ = Render(sequelize)

module.exports = sequelize
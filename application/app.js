const express = require("express")
const db = require('./database/database');
require('dotenv').config();

db.sync()

const app = express();
const port = 8000;

var env_test = process.env.TEST || 'FALSE'
app.get("/health", (req, res) => {
	res.send("Application status: healthly \nEnvironment variables loaded: " + env_test);
})

app.listen(port, () => {
	console.log(`Example app listening on container port: ${port}`);
})
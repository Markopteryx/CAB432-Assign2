const express = require("express")
require('dotenv').config();

const app = express();
const port = 8000;

var env_test = process.env.TEST || 'FALSE'
app.get("/health", (req, res) => {
	res.send("Application status: healthly \nEnvironment variables loaded: " + env_test);
})

app.listen(port, () => {
	console.log(`Example app listening on container port: ${port}`);
})
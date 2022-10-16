const express = require("express")
require('dotenv').config();

const app = express();
const port = 8000;

console.log(process.env.TREMAIN || "failed")
console.log(process.env.MARKO || "failed")

app.get("/health", (req, res) => {
	res.send("It's working!");
})

app.listen(port, () => {
	console.log(`Example app listening on container port: ${port}`);
})

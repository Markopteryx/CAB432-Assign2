const express = require("express")

const app = express();
const port = 8000;

app.get("/health", (req, res) => {
	res.send("It's working!");
})

app.listen(port, () => {
	console.log(`Example app listening on container port: ${port}`);
})

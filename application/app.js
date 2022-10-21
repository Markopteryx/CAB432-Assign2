const express = require("express")
const db = require('./database/database');
require('dotenv').config();

var db_status;


try {
	db.authenticate()
	var db_status = "authenticated"
} catch(error) {
	console.log(error, error.message)
}

try {
	db.sync()
	var db_status = "synced"
} catch(error) {
	console.log(error, error.message)
}

const app = express();
const port = 8000;

var env_test = process.env.TEST || 'FALSE'
app.get("/health", (req, res) => {
	res.send(`<table>
		<thead>
		  <tr>
			<th>Feature</th>
			<th>Status</th>
		  </tr>
		</thead>
		<tbody>
		  <tr>
			<td>Environment Variables Loaded</td>
			<td>${env_test}</td>
		  </tr>
		  <tr>
			<td>Database Status</td>
			<td>${db_status}</td>
		  </tr>
		  <tr>
			<td></td>
			<td></td>
		  </tr>
		</tbody>
		</table>`);
})

app.listen(port, () => {
	console.log(`Example app listening on container port: ${port}`);
})
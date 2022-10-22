const express = require("express")
//const { Transfer } = require('./transfer')
require('dotenv').config();

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
			<td></td>
		  </tr>
		  <tr>
			<td></td>
			<td></td>
		  </tr>
		</tbody>
		</table>`);
})

app.get('/status/:id', (req, res) => {
	res.send(`The status of ${req.params.id} is completed`)
})

app.get('/express_backend', (req, res) => { //Line 9
	res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' }); //Line 10
});

app.listen(port, () => {
	console.log(`Example app listening on container port: ${port}`);
})

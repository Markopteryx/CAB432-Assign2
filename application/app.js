const express = require("express")
//const { Transfer } = require('./transfer')
require('dotenv').config();
const cors = require('cors')
const multer = require('multer')

const app = express();
const port = 8000;

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
	  cb(null, 'uploadBlends/')
	},
	filename: (req, file, cb) => {
	  cb(null, file.originalname)
	},
  })

const upload = multer({ storage: storage })

app.use(cors())

app.post('/uploadBlends', upload.single('file'), function (req, res) {
  res.json({})
})

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

app.listen(port, () => {
	console.log(`Example app listening on container port: ${port}`);
})

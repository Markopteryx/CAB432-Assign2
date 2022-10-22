require('dotenv').config();
const express = require("express")
const { v4: uuidv4 } = require('uuid');
const { uploadFile, downloadFile } = require('./transfer')
const cors = require('cors')
const multer = require('multer')
const fs = require('fs')
const path = require('path');

const app = express();
const port = 8000;

// Create Directories
var dir = './blends';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
var dir2 = './uploadBlends'
if (!fs.existsSync(dir2)){
    fs.mkdirSync(dir2);
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
	  cb(null, 'uploadBlends/')
	},
	filename: (req, file, cb) => {
	  cb(null, file.originalname)
	},
  })

function checkFileType(file, cb){
	// Allowed ext
	const filetypes = /blend/;
	// Check ext
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

	if(extname){
		return cb(null,true);
	} else {
		cb('Error: Blend Files Only!');
	}
}

const upload = multer({ 
	storage: storage,
	fileFilter: function(_req, file, cb) {
		checkFileType(file, cb)
}})

app.use(cors())

app.post('/uploadBlends', upload.single('file'), async function (req, res) {
	var uuid = uuidv4()
	var filePath = "blends/" + uuid + ".blend"
	await fs.rename("./" + req.file.path, filePath , function(err) {
		 if ( err ) console.log('ERROR: ' + err);
	})
	// Upload to S3
	uploadFile(filePath)
	// Plan SQS
	// ...
	// Update RDS
	// ...
	// Send SQS
	// ...
	// Delete Local Blend
	// ...
	// Send RDS State to FrontEnd
	// ...
	res.json({renderID: uuid})
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

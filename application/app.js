require('dotenv').config();

const fs = require('fs')
const path = require('path');

const cors = require('cors')
const multer = require('multer')

const express = require("express")
const { v4: uuidv4 } = require('uuid');
const execSync = require("child_process").execSync;

const { uploadFile, createFrame, createRender, sendSQSMessage } = require('./transfer')

const app = express();
const port = 8000;

// Create Directories for blends
var dir = './blends';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
var dir2 = './uploadBlends'
if (!fs.existsSync(dir2)){
    fs.mkdirSync(dir2);
}

// Store result to directory
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

app.get('/sendMsg', (req, res) => {
	sendSQSMessage("1223", "323", 2, "ddfdffd")

	res.send("<p> Sent message </p>")
})

app.post('/uploadBlends', upload.single('file'), async function (req, res) {
	var uuid = uuidv4()
	var filePath = "blends/" + uuid + ".blend"
	await fs.rename("./" + req.file.path, filePath , function(err) {
		 if ( err ) console.log('ERROR: ' + err);
	})
	// Upload to S3
	var filePromise = uploadFile(filePath)

	// Plan SQS
	// ...

	// Update RDS
	var totalFrames = parseInt(execSync(`python3.9 ./blend_render_info.py ${filePath}`).toString("utf8"));
	createRender(uuid, filePath, totalFrames)
	for(var i=1; i <= totalFrames; i++) {
		createFrame(`${uuid}_${i.toString()}`, uuid, i)
	}

	// Send SQS
	// ...

	// Delete Local Blend
	(async () => {	
		await filePromise
		fs.unlink(filePath, (error) => {
			if (error) {console.log(error, error.message)}
		})
		console.log("Cleaned up .blend file")
	})();

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
	console.log(`Backend >> Listening on container port: ${port}`);
})

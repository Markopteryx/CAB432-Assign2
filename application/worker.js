require('dotenv').config();

const fs = require('fs')
const path = require('path');
const execSync = require("child_process").execSync;

const { uploadFile, downloadFile, updateFrame, updateRender, getSQSMessage} = require('./transfer')

// Create directory
var dir = './images';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

async function main() {
    // Get SQS
    var message;
    while (!message) {
        message = await getSQSMessage();
        await new Promise(r => setTimeout(r, 3000))
    }

    console.log(message)

    // Download Blend File


    // Render Frame


    // Upload Frame


    // Update RDS


    // Delete Local Frame & Blend
}

(async () => {
    while(true) await main()
  })()
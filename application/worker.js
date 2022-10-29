require('dotenv').config();

const fs = require('fs')
const path = require('path');
const execSync = require("child_process").execSync;

const { uploadFile, 
        downloadFile, 
        updateFrame, 
        updateRender, 
        getSQSMessage,
        extendFrameVisibility } = require('./transfer')

var working = false

// Create directory
var imageDir = "./images";
var blendsDir = "./blends"
if (!fs.existsSync(imageDir)){
    fs.mkdirSync(imageDir);
}
if (!fs.existsSync(blendsDir)){
    fs.mkdirSync(blendsDir);
}

async function visibilityExtender(handle) {
    const duration = 120;
    //await new Promise(r => setTimeout(r, 60000))
    while(working) {
        await extendFrameVisibility(handle, duration)
        await new Promise(r => setTimeout(r, 60000))
    }
}

async function main() {
    // Get SQS
    var message;
    while (!message) {
        message = await getSQSMessage();
        await new Promise(r => setTimeout(r, 3000))
    } 
    console.log("Message recieved -- starting worker")
    working = true;

    visibilityExtender(message['handle']) 
    
    // Download Blend File
    await downloadFile(message['blendFile'])

    var result = execSync(`blender -b ${message['blendFile']} -o /app/images/${message['renderID']}_# -P blenderConfigs.py -f ${message['frameNo']}`).toString("utf8")
    // Render Frame


    // Upload Frame


    // Update RDS


    // Delete Local Frame & Blend
}

(async () => {
    while(true) await main()
  })()
require('dotenv').config();

const fs = require('fs')
const path = require('path');
const sequelize = require('./database/database');
const execSync = require("child_process").execSync;

const { uploadFile, 
        downloadFile, 
        updateFrame, 
        updateRender, 
        getSQSMessage,
        extendFrameVisibility,
        deleteSQSMessage,
        incrementRender,
        getAllFrames } = require('./transfer')

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
        var extended = await extendFrameVisibility(handle, duration)
        if (!extended) {
            return
        }
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
    console.log("Worker >> Started work")
    working = true;

    visibilityExtender(message['handle']) 
    
    // Download Blend File
    await downloadFile(message['blendFile'])

     // Render Frame
    execSync(`blender -b ${message['blendFile']} -o /app/images/${message['renderID']}_# -P blenderConfigs.py -f ${message['frameNo']}`).toString("utf8")

    // Upload Frame
    var frameURL = `images/${message['frameID']}.png`
    var fileUploaded = await uploadFile(frameURL)

    // Update RDS
    var updatedFrame = await updateFrame(message['frameID'], {
        completeStatus : true,
        frameURL : frameURL,
    })

    var updatedRender = await incrementRender(message['renderID'])

    working = false
    // Delete SQS Message
    deleteSQSMessage(message['handle']);

    if (updatedRender['framesCompleted'] == updatedRender['totalFrames']) {
        // Download All Frames
        var allFrames = await getAllFrames(message['renderID'])

        var downloadPromises = []
        for (frame in allFrames) {
            var filePromise = downloadFile(allFrames[frame]['dataValues']['frameURL'])
            downloadPromises.push(filePromise)
        }
        for (promise in downloadPromises) {
            await promise
        }
        // FFMPEG or Blender Merge
        execSync(`blender -b -o /app/images -P createVideo.py`).toString("utf8")
    }

    // Delete Local Frame & Blend
	(async () => {	
		fs.unlink(message['blendFile'], (error) => {
			if (error) {console.log(error, error.message)}
		})
        fs.unlink(frameURL, (error) => {
			if (error) {console.log(error, error.message)}
		})
		//console.log("Worker >> Cleaned up .blend file and image")
	})();
}

(async () => {
    while(true) await main()
  })()
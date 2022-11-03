require('dotenv').config();

const fs = require('fs')
const path = require('path');
const sequelize = require('./database/database');
const execSync = require("child_process").execSync;
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const fsExtra = require('fs-extra')

const ffmpegPath = ffmpeg.path

const { uploadFile, 
        downloadFile, 
        updateFrame, 
        updateRender, 
        getSQSMessage,
        extendFrameVisibility,
        deleteSQSMessage,
        incrementRender,
        getAllFrames } = require('./transfer');
const render = require('./database/render');

var working = false 

// Create directory
var imageDir = "./images";
var blendsDir = "./blends"
var outputDir = "./outputs"
if (!fs.existsSync(imageDir)){
    fs.mkdirSync(imageDir);
}
if (!fs.existsSync(blendsDir)){
    fs.mkdirSync(blendsDir);
}
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

// Extends the Message Visibility
async function visibilityExtender(handle) {
    const duration = 120;
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
    var RenderParams = execSync(`blender -b ${message['blendFile']} -o /app/images/${message['renderID']}_# -P blenderConfigs.py -f ${message['frameNo']}`).toString()

    var FPSRE = /FPS_[0-9]+/g
    var renderFPS = RenderParams.match(FPSRE)[0].slice(4)

    // Upload Frame
    var frameURL = `images/${message['frameID']}.png`
    var fileUploaded = await uploadFile(frameURL)

    // Update RDS
    var updatedFrame = await updateFrame(message['frameID'], {
        completeStatus : true,
        frameURL : frameURL,
    })

    if(!updatedFrame) {
        return
    }

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
            await downloadPromises[promise]
        } 

        var outputFilePath = `outputs/${message['renderID']}.mp4`
        // FFMPEG or Blender Merge
        execSync(`${ffmpegPath} -framerate ${renderFPS} -pattern_type glob -i "images/${message['renderID']}_*.png" -vcodec libx264 -movflags +faststart ${outputFilePath}`).toString("utf8")

        // Upload Video
        await uploadFile(outputFilePath);

        // Update RDS
        updateRender(message['renderID'], {
            renderDone : true
        });

        // Delete Local Video
        (async () => {	
            fs.unlink(outputFilePath, (error) => {
                if (error) {console.log(error, error.message)}
            })
        })();
    }

    // Delete Local Frame & Blend
	(async () => {	
		fs.unlink(message['blendFile'], (error) => {
			if (error) {console.log(error, error.message)}
		})
        fsExtra.emptyDirSync(imageDir, (error) => {
			if (error) {console.log(error, error.message)}
		})
		//console.log("Worker >> Cleaned up .blend file and image")
	})();

}

// Keep working
(async () => {
    while(true) await main()
  })()
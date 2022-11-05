require('dotenv').config();

const fs = require('fs')

const redis = require('redis'); 
const commandOptions = require('redis').commandOptions

const AWS = require('aws-sdk')
const db = require('./database/database');

AWS.config.update({regions : 'ap-southeast-2'})
var sqs = new AWS.SQS({region:'ap-southeast-2'});

var redisHost = process.env.REDIS_HOST || 'redis-server'

// Create and Test Database
var db_status;

try {
	db.authenticate()
	var db_status = "Authenticated"
    console.log(`Database >> ${db_status}`)
} catch(error) {
	console.log(error, error.message)
}

try {
	db.sync()
	var db_status = "Synced"
    console.log(`Database >> ${db_status}`)
} catch(error) {
	console.log(error, error.message)
}

// Create Redis Buffer Client
const redisBufferClient = redis.createClient({
    socket: {
        port: 6379,
        host: redisHost,
        return_buffers: true
    }
});
   (async () => {
         try {
            await redisBufferClient.connect({
            });
        } catch (err) { 
            console.log (err);
        } 
})();

// Create Redis String Client
const redisStringClient = redis.createClient({
    socket: {
        port: 6379,
        host: redisHost
    }
});
   (async () => {
         try {
            await redisStringClient.connect({
            });
        } catch (err) { 
            console.log (err);
        } 
})();

// Create S3 
const bucketName = 'cab432-markouksanovic';
const S3 = new AWS.S3()

var bucketParams = {
    Bucket : bucketName,
    CreateBucketConfiguration : {
        LocationConstraint: "ap-southeast-2"},
};

(async () => {
    try {
        await S3.createBucket(bucketParams).promise();
        console.log(`Created bucket: ${bucketName}`);
    } catch (error) {
        if (error.statusCode !== 409) {
            console.log(`Error creating bucket: ${error}`);
        }
    }
})();

// Upload File
async function uploadFile(filePath) {
    var redisPromise = uploadBinaryToRedis(filePath)
    var s3Promise = uploadFileToS3(filePath)

    await redisPromise
    await s3Promise
}

// Download File
async function downloadFile(filePath) {
    var result = await getBinaryFromRedis(filePath)

    if (result) {
        fs.writeFileSync(filePath, result) 
        return
    }

    var result = await getFileFromS3(filePath)
    if(result) {
        fs.writeFileSync(filePath, result['Body'])
        uploadBinaryToRedis(filePath)
        return result
    } 

    throw new Error("File not found in Redis or S3 :(")
}

// Upload to Buffer Redis
async function uploadBinaryToRedis(filePath) {
    var data = fs.readFileSync(filePath)
    redisBufferClient.set(
        filePath,
        data
    )
    console.log(`Redis (Buffer) >> Successfully uploaded ${filePath}`); 
}

// Pull from Buffer Redis
async function getBinaryFromRedis(filePath) {
    data = await redisBufferClient.get(commandOptions({ returnBuffers: true }),filePath)
    return data
}

// Upload to String Redis
async function uploadJSONToRedis(key, body) {
    try {    
        redisStringClient.set(
        key,
        JSON.stringify({...body})
    )
    console.log(`Redis (String) >> Successfully uploaded ${key}`); 
        } catch (error) {
            console.log(error, error.message)
        }
}

// Pull from String Redis
async function getJSONFromRedis(key) {
    var data = await redisStringClient.get(key)
    if (data) {
        const resultJSON =  JSON.parse(data); 
        return resultJSON
    }
}

// Upload to S3
async function uploadFileToS3(filePath) {
    const fileContent = fs.readFileSync(filePath);
    const objectParams = { Bucket: bucketName, Key: filePath, Body: fileContent};        
    await S3.putObject(objectParams).promise();  
    console.log(`S3 >> Successfully uploaded to s3://${bucketName}/${filePath}`); 
}

// Get from S3
async function getFileFromS3(key) {
    var S3Result;
    try {    
        const params = {Bucket: bucketName, Key: key}; 
        S3Result = await S3.getObject(params).promise();
    } catch (error) {}
    return S3Result;
}

// Get Render info from RDS
async function getRenderRDS(renderID) {
    try{
        var newRender = await db.models.Render.findOne({ where: { renderID: renderID}});
        return newRender.dataValues
    } catch (error) {}
}

// Get Frame info from RDS
async function getFrameRDS(frameID) {
    try{
        var newFrame = await db.models.Frame.findOne({ where: { frameID: frameID}});
        return newFrame.dataValues
    } catch (error) {
        console.log(error, error.message)
    }
}

// Get Render
async function getRender(renderID) {
    var result = await getJSONFromRedis(renderID)

    if(result) {
        return result
    }
    result = await getRenderRDS(renderID)
    return result
}

// Get Frame
async function getFrame(frameID) {
    var result = await getJSONFromRedis(frameID)

    if(result) {
        return result
    }
    result = await getFrameRDS(frameID)
    return result
}

// Update Frame
async function updateFrame(frameID, updateData) {
    var newFrame = await db.models.Frame.findOne({ where: { frameID: frameID}});
    if (!newFrame) {
        return
    }
    newFrame.set(updateData);
    newFrame.save()
    uploadJSONToRedis(frameID, newFrame.dataValues)
    return newFrame
}

// Create Frame
async function createFrame(frameID, renderID, frameNo){
    var frame = await db.models.Frame.create({
        frameID : frameID,
        renderID: renderID,
        frame: frameNo
    })
    console.log('Database >> Frame Successfully Uploaded')
    uploadJSONToRedis(frame.dataValues.frameID, frame.dataValues)
}

// Update Render
async function updateRender(renderID, updateData) {
    var newRender = await db.models.Render.findOne({ where: { renderID: renderID}});
    newRender.set(updateData);
    newRender.save()
    uploadJSONToRedis(renderID, newRender.dataValues)
    return newRender
}

// Create Render
async function createRender(ID, bucketURL, totalFrames) {
    var render = await db.models.Render.create({
        renderID : ID,
        blendFile: bucketURL,
        totalFrames: totalFrames
    })
    console.log('Database >> Render Successfully Uploaded')
    uploadJSONToRedis(render.dataValues.renderID, render.dataValues)
}

// Increment Render Frames
async function incrementRender(renderID){
    var newRender = await db.models.Render.findOne({ where: { renderID: renderID}});
    newRender['framesCompleted'] = newRender['framesCompleted'] + 1
    await newRender.save()
    uploadJSONToRedis(renderID, newRender.dataValues)
    return newRender
}

// Add Message to SQS
async function sendSQSMessage(renderID, frameID, frameNo, blendFile) {
    var messageString = JSON.stringify(
        {
            frameID : frameID,
            renderID : renderID, 
            frameNo : frameNo,
            blendFile : blendFile
        })
    try {
        const params = {
            QueueUrl: "https://sqs.ap-southeast-2.amazonaws.com/901444280953/n8039062-Assign2-SQS",
            MessageBody: messageString
        }
        var queueResult = await sqs.sendMessage(params).promise();
    } catch (error) {
        console.log("Didn't add message to queue", error, error.message)
    }
}

// Get SQS Message
async function getSQSMessage() {
    try{
        const params = {
            QueueUrl : "https://sqs.ap-southeast-2.amazonaws.com/901444280953/n8039062-Assign2-SQS",
            VisibilityTimeout: 120
        }
        var getMessage = await sqs.receiveMessage(params).promise();
        if (!getMessage.Messages) {
            return null
        }
        var messageBody = JSON.parse(getMessage.Messages[0]['Body'])
        var handle = getMessage.Messages[0]['ReceiptHandle']
        
        return {
            frameID : messageBody.frameID, 
            renderID : messageBody.renderID,
            frameNo : messageBody.frameNo, 
            blendFile : messageBody.blendFile,
            handle : handle}
    } catch (error) {
        console.log("Count not find message", error, error.message)
    }
}; 

// Extend Visibility of SQS Message
async function extendFrameVisibility(handle, duration) {
    var params = {
        QueueUrl : "https://sqs.ap-southeast-2.amazonaws.com/901444280953/n8039062-Assign2-SQS",
        ReceiptHandle: handle,
        VisibilityTimeout: duration
    }
    sqs.changeMessageVisibility(params, function(err, data) {
        if (err) return null; 
      });
}

// Delete SQS Message
async function deleteSQSMessage(handle) {
    var deleteParams = {
        QueueUrl: "https://sqs.ap-southeast-2.amazonaws.com/901444280953/n8039062-Assign2-SQS",
        ReceiptHandle: handle
      };
      var removedMessage = await sqs.deleteMessage(deleteParams).promise();
      console.log("Worker >> Finished Frame")
}

// Get all Frames from RDS
async function getAllFrames(renderID) {
    var Frames = await db.models.Frame.findAll({ where: { renderID: renderID}});
    return Frames
}

// Create Pre-signed URL
function generatePresignedURL(ID) {
    var filePath = "outputs/" + ID.toString() + ".mp4";
    const url = S3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: filePath,
        Expires: 21600 // 6hrs
    })
    return url.toString()
}

module.exports = {
    uploadFile : uploadFile,
    downloadFile : downloadFile,
    createFrame : createFrame,
    updateFrame : updateFrame,
    getFrame : getFrame,
    createRender : createRender,
    updateRender : updateRender,
    getRender : getRender,
    sendSQSMessage : sendSQSMessage,
    getSQSMessage : getSQSMessage,
    extendFrameVisibility : extendFrameVisibility,
    deleteSQSMessage : deleteSQSMessage,
    incrementRender : incrementRender,
    getAllFrames : getAllFrames,
    generatePresignedURL : generatePresignedURL
  };
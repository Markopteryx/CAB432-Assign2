require('dotenv').config();

const fs = require('fs')

const redis = require('redis'); 
const AWS = require('aws-sdk')

const db = require('./database/database');

AWS.config.update({regions : 'ap-southeast-2'})

var redisHost = process.env.REDIS_HOST || 'redis-server'

var sqs = new AWS.SQS({region:'ap-southeast-2'});

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
	db.sync(force=true)
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
        fs.writeFileSync(filePath, result)
        uploadBinaryToRedis(filePath)
        return 
    } 

    throw new Error("File not found in Redis or S3 :(")
}

// Upload to Buffer Redis
async function uploadBinaryToRedis(filePath) {
    redisBufferClient.set(
        filePath,
        3600,
        fs.readFileSync(filePath)
    )
    console.log(`Redis (Buffer) >> Successfully uploaded ${filePath}`); 
}

// Pull from Buffer Redis
async function getBinaryFromRedis(filePath) {
    data = await redisBufferClient.get(filePath)
    return data
}

// Upload to String Redis
async function uploadJSONToRedis(key, body) {
    try {    
        redisStringClient.set(
        key,
        3600,
        JSON.stringify({...body})
    )
    console.log(`Redis (String) >> Successfully uploaded ${key}`); 
        } catch (error) {
            console.log(error, error.message)
        }
}

// Pull from String Redis
async function getJSONFromRedis(key) {
    data = await redisStringClient.get(key)
    if (result) {
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

async function getRenderRDS(renderID) {
    try{
        var newRender = await db.models.Render.findOne({ where: { renderID: renderID}});
        return newRender.dataValues
    } catch (error) {
        console.log(error, error.message)
    }
}

async function getFrameRDS(frameID) {
    try{
        var newFrame = await db.models.Frame.findOne({ where: { frameID: frameID}});
        return newFrame.dataValues
    } catch (error) {
        console.log(error, error.message)
    }
}

async function getRenderRedis(renderID) {
    try{
        var render = await getJSONFromRedis(renderID)
        return render
    } catch (error) {
        console.log(error, error.message)
    }
}

async function getFrameRedis(frameID) {
    try{
        var frame = await getJSONFromRedis(frameID)
        return frame
    } catch (error) {
        console.log(error, error.message)
    }
}

async function getRender(renderID) {
    var result = await getJSONFromRedis(renderID)

    if(result) {
        return result
    }
    result = await getRenderRDS(renderID)
    return result
}

async function getFrame(frameID) {
    var result = await getJSONFromRedis(frameID)

    if(result) {
        return result
    }
    result = await getFrameRDS(frameID)
    return result
}

async function updateFrame(frameID, updateData) {
    var newFrame = await db.models.Render.findOne({ where: { frameID: frameID}});
    newFrame.set(updateData);
    newFrame.save()
    uploadJSONToRedis(frameID, newFrame.dataValues)
}

async function createFrame(frameID, renderID, frameNo){
    var frame = await db.models.Frame.create({
        frameID : frameID,
        renderID: renderID,
        frame: frameNo
    })
    uploadJSONToRedis(frame.dataValues.frameID, frame.dataValues)
}

async function updateRender(renderID, updateData) {
    var newRender = await db.models.Render.findOne({ where: { renderID: renderID}});
    newRender.set(updateData);
    newRender.save()
    uploadJSONToRedis(renderID, newRender.dataValues)
}

async function createRender(ID, bucketURL, totalFrames) {
    var render = await db.models.Render.create({
        renderID : ID,
        blendFile: bucketURL,
        totalFrames: totalFrames
    })
    console.log('Database >> Successfully Uploaded')
    uploadJSONToRedis(render.dataValues.renderID, render.dataValues)
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

async function getSQSMessage() {
    try{
        const params = {
            QueueUrl : "https://sqs.ap-southeast-2.amazonaws.com/901444280953/n8039062-Assign2-SQS"
        }
        var getMessage = await sqs.receiveMessage(params).promise();
        if (!getMessage.Messages) {
            return null
        }
        //console.log(getMessage.Messages[0]['Body'])
        var messageBody = JSON.parse(getMessage.Messages[0]['Body'])
        
        return {
            frameID : messageBody.frameID, 
            renderID : messageBody.renderID,
            frameNo : messageBody.frameNo, 
            blendFile : messageBody.blendFile}
    } catch (error) {
        console.log("Count not find message", error, error.message)
    }
};

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
    getSQSMessage : getSQSMessage
    // delete from S3 (maybe)
  };
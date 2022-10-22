const db = require('./database/database');
const fs = require('fs')
const redis = require('redis');  
const AWS = require('aws-sdk')
require('dotenv').config();

var redisHost = process.env.REDIS_HOST || 'redis-server'

// Create Redis Client
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
AWS.config.update({regions : 'ap-southeast-2'})
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


async function uploadFile(filePath) {
    var redisPromise = uploadBinaryToRedis(filePath)
    var s3Promise = uploadFileToS3(filePath)

    await redisPromise
    await s3Promise
}

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

async function uploadBinaryToRedis(filePath) {
    redisBufferClient.set(
        filePath,
        3600,
        fs.readFileSync(filePath)
    )
    console.log(`Successfully uploaded ${filePath} to Redis`); 
}

async function getBinaryFromRedis(filePath) {
    data = await redisBufferClient.get(filePath)
    return data
}

async function uploadFileToS3(filePath) {
    const fileContent = fs.readFileSync(filePath);
    const objectParams = { Bucket: bucketName, Key: filePath, Body: fileContent};        
    await S3.putObject(objectParams).promise();  
    console.log(`Successfully uploaded data to ${bucketName}/${filePath}`); 
}

async function getFileFromS3(key) {
    var S3Result;
    try {    
        const params = {Bucket: bucketName, Key: key}; 
        S3Result = await S3.getObject(params).promise();
    } catch (error) {}
    return S3Result;
}

/*
var db_status;

try {
	db.authenticate()
	var db_status = "authenticated"
} catch(error) {
	console.log(error, error.message)
}

try {
	db.sync()
	var db_status = "synced"
} catch(error) {
	console.log(error, error.message)
}
*/

module.exports = {
    // create RDS record
    // update RDS record
    // read RDS record
    uploadFile : uploadFile,
    downloadFile : downloadFile,
    // delete from S3 (maybe)
  };
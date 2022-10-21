const db = require('./database/database');
const fs = require('fs')
const AWS = require('aws-sdk')
require('dotenv').config();

var redisHost = process.env.REDIS_HOST || 'redis-server'

// Create Redis Client
const redisClient = redis.createClient({
    socket: {
        port: 6379,
        host: redisHost
    },
    {'return_buffers' : true} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
});
   (async () => {
         try {
            await redisClient.connect({
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


async function uploadFile() {

}

async function uploadToRedis(key, body) {
    redisClient.setEx(
        key,
        3600,
        JSON.stringify({...body})
    )
}

async function getFromRedis(key) {
    data = await redisClient.get(key)
    return data
}

async function uploadFileToS3(key, fileName) {
    const fileContent = fs.readFileSync(fileName);
    const objectParams = { Bucket: bucketName, Key: key, Body: fileContent};        
    await S3.putObject(objectParams).promise();  
    console.log(`Successfully uploaded data to ${bucketName}/${key}`); 
}

async function getFileFromS3(key) {
    var S3Result;
    try {    
        const params = {Bucket: bucketName, Key: key}; 
        S3Result = await S3.getObject(params).promise();
        fs.writeFileSync(key, S3Result)
    } catch (error) {}
    return S3Result;
}

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
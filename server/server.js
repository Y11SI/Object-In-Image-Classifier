const express = require('express'); //web server framework
const multer = require('multer'); //file uploading
const { Storage } = require('@google-cloud/storage'); //google cloud storage
const cors = require('cors'); //cross-origin resource sharing (required to work)
const { ImageAnnotatorClient } = require('@google-cloud/vision'); //image classification API
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager'); //service account key
const app = express();
const PORT = process.env.PORT || 3000; //use app engine port or local port

//enable all CORS requests
app.use(cors()); //allows us to communicate with web pages on different domains

//initialize Google Secret Manager
const secretClient = new SecretManagerServiceClient();

//initialize variables
let storage, bucket, visionClient;

async function initializeApp() {
    const [version] = await secretClient.accessSecretVersion({
        name: 'projects/262789808088/secrets/service-account-key/versions/latest', //refers to securely stored service account key
    });

    const credentials = JSON.parse(version.payload.data.toString('utf8'));

    //initialize Google Cloud Storage Bucket
    storage = new Storage({credentials});
    bucket = storage.bucket('uploaded-images11');

    //initialize Google Cloud Vision
    visionClient = new ImageAnnotatorClient({credentials});

}

initializeApp().catch(console.error);

//configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
});

//readiness and liveness probes for app engine
app.get('/readiness_check', (req, res) => {
    res.status(200).send('Ready');
});
  
  app.get('/liveness_check', (req, res) => {
    res.status(200).send('Alive');
});

app.post('/upload', upload.array('images'), async (req, res) => { //listen for POST requests
    if (!req.files) { //if no files were uploaded
        return res.status(400).send('No files uploaded.');
    }

    try {
        const classificationPromises = req.files.map(async file => { //handle uploads to cloud and image classification
            const blob = bucket.file(file.originalname); //create reference to blob in storage bucket
            let signedUrl;
            await new Promise((resolve, reject) => {
                const blobStream = blob.createWriteStream({ //write stream to upload file to cloud server
                    metadata: {
                        contentType: file.mimetype,
                    },
                });

                blobStream.on('error', err => reject(err));
                blobStream.on('finish', async () => { 
                    //generate a signed URL for the uploaded image file
                    const [url] = await blob.getSignedUrl({
                        version: 'v4',
                        action: 'read',
                        expires: Date.now() + 15 * 60 * 1000, //URL expires in 15 minutes
                    });
                    signedUrl = url; //save the signed URL
                    resolve(); //upload process is completed
                });
                blobStream.end(file.buffer);
            });

            //make sure signedUrl is defined before proceeding
            if (!signedUrl) {
                throw new Error('Failed to generate a signed URL');
            }

            //construct URI for image file
            const gcsUri = `gs://${bucket.name}/${blob.name}`;
            //perform object localization on the image (identify 1 or more objects within image)
            const [localizationResult] = await visionClient.objectLocalization(gcsUri);
            //get classified objects from google classification model
            const objects = localizationResult.localizedObjectAnnotations;

            return {
                imageUrl: signedUrl, //set image URL to signedUrl
                objects: objects.map(obj => ({
                    name: obj.name, // get object(s) name
                    confidence: (obj.score * 100).toFixed(2), //get confidence value of object(s)
                    boundingPoly: obj.boundingPoly //get bounding boxes of object(s)
                }))
            };
        });

        //wait for all promises to resolve and get results
        const classifications = await Promise.all(classificationPromises);
        res.json({ //sending response of success and classifications (or error)
            message: `Uploaded and classified ${req.files.length} files.`,
            classifications: classifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred during file upload or classification.');
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}!`); //debug message
  });
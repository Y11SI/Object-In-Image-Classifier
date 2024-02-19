const express = require('express'); // web server framework
const multer = require('multer'); // file uploading
const { Storage } = require('@google-cloud/storage'); // google cloud storage
const cors = require('cors'); // cross-origin resource sharing (required to work)
const { ImageAnnotatorClient } = require('@google-cloud/vision'); // image classification model
const app = express();
const port = 3000; //initialise server to port 3000

// Enable all CORS requests
app.use(cors()); // communicate to web pages on different domains

// Initialize Google Cloud Storage
const storage = new Storage({ //google service account key and project ID
    keyFilename: '/Users/yahya/Documents/Project/inbound-augury-413219-3d23cb789eaf.json',
    projectId: 'inbound-augury-413219',
});
const bucket = storage.bucket('uploaded-images11'); // storage bucket ID

// Initialize Google Cloud Vision
const visionClient = new ImageAnnotatorClient({ //also uses google service account key
    keyFilename: '/Users/yahya/Documents/Project/inbound-augury-413219-3d23cb789eaf.json'
});

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
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

                blobStream.on('error', err => reject(err)); //catch any errors
                blobStream.on('finish', async () => { // finish upload
                    // Generate a signed URL for the uploaded file
                    const [url] = await blob.getSignedUrl({
                        version: 'v4',
                        action: 'read',
                        expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
                    });
                    signedUrl = url; // Capture the signed URL outside promise
                    resolve(); //upload process is completed
                });
                blobStream.end(file.buffer);
            });

            // Ensure signedUrl is defined
            if (!signedUrl) {
                throw new Error('Failed to generate a signed URL');
            }

            const gcsUri = `gs://${bucket.name}/${blob.name}`; //construct URI for image file
            //perform object localization on the image
            const [localizationResult] = await visionClient.objectLocalization(gcsUri);
            //get classified objects from google algorithm/model
            const objects = localizationResult.localizedObjectAnnotations;

            return {
                imageUrl: signedUrl, // set image URL
                objects: objects.map(obj => ({
                    name: obj.name, // get object(s) name
                    confidence: (obj.score * 100).toFixed(2), //get confidence value of object(s)
                    boundingPoly: obj.boundingPoly //get bounding boxes of object(s)
                }))
            };
        });

        //wait for all promises to resolve and get results
        const classifications = await Promise.all(classificationPromises);
        res.json({ //send response of success and classifications (or error)
            message: `Uploaded and classified ${req.files.length} files.`,
            classifications: classifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred during file upload or classification.');
    }
});
//message to check if node server is ready
app.listen(port, () => console.log(`Server listening on port ${port}!`));

//start node server using this command in the terminal:
// >>> node server.js
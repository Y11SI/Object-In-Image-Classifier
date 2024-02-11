const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const app = express();
const port = 3000;

// Enable all CORS requests
app.use(cors());

// Initialize Google Cloud Storage
const storage = new Storage({
    keyFilename: '/Users/yahya/Documents/Project/inbound-augury-413219-3d23cb789eaf.json',
    projectId: 'inbound-augury-413219',
});
const bucket = storage.bucket('uploaded-images11');

// Initialize Google Cloud Vision
const visionClient = new ImageAnnotatorClient({
    keyFilename: '/Users/yahya/Documents/Project/inbound-augury-413219-3d23cb789eaf.json'
});

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
});

app.post('/upload', upload.array('images'), async (req, res) => {
    if (!req.files) {
        return res.status(400).send('No files uploaded.');
    }

    try {
        const classificationPromises = req.files.map(async file => {
            const blob = bucket.file(file.originalname);
            let signedUrl;
            await new Promise((resolve, reject) => {
                const blobStream = blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype,
                    },
                });

                blobStream.on('error', err => reject(err));
                blobStream.on('finish', async () => {
                    // Generate a signed URL for the uploaded file
                    const [url] = await blob.getSignedUrl({
                        version: 'v4',
                        action: 'read',
                        expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
                    });
                    signedUrl = url; // Capture the signed URL outside promise
                    resolve();
                });
                blobStream.end(file.buffer);
            });

            // Ensure signedUrl is defined
            if (!signedUrl) {
                throw new Error('Failed to generate a signed URL');
            }

            const gcsUri = `gs://${bucket.name}/${blob.name}`;
            const [localizationResult] = await visionClient.objectLocalization(gcsUri);
            const objects = localizationResult.localizedObjectAnnotations;

            return {
                imageUrl: signedUrl,
                objects: objects.map(obj => ({
                    name: obj.name,
                    confidence: (obj.score * 100).toFixed(2),
                    boundingPoly: obj.boundingPoly
                }))
            };
        });

        const classifications = await Promise.all(classificationPromises);
        res.json({
            message: `Uploaded and classified ${req.files.length} files.`,
            classifications: classifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred during file upload or classification.');
    }
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
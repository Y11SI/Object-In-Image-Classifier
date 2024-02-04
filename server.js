const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
const path = require('path');
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

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
});

app.post('/upload', upload.array('images'), (req, res) => {
    if (!req.files) {
        return res.status(400).send('No files uploaded.');
    }

    const files = req.files;
    files.forEach(file => {
        // Create a new blob in the bucket and upload the file data.
        const blob = bucket.file(file.originalname);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on('error', (err) => {
            console.log(err);
            return res.status(500).send(err);
        });

        blobStream.on('finish', () => {
            // The public URL can be used to directly access the file via HTTP.
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            console.log(`Successfully uploaded ${file.originalname} to ${publicUrl}`);
        });

        blobStream.end(file.buffer);
    });

    res.send({ message: `Uploaded ${files.length} files!` });
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));


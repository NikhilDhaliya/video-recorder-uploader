const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());

const storage = new Storage({ keyFilename: 'gcp-key.json' }); 
const bucket = storage.bucket('gcs-bucket');

app.post('/upload-chunk', upload.single('chunk'), async (req, res) => {
  try {
    const chunkId = req.body.chunkId || Date.now();
    const videoId = req.body.videoId || 'session';
    const file = bucket.file(`uploads/${videoId}/chunk-${chunkId}.webm`);

    const stream = file.createWriteStream({ resumable: false });
    stream.on('error', (err) => res.status(500).send(err.message));
    stream.on('finish', () => res.status(200).send('Uploaded'));
    stream.end(req.file.buffer);
  } catch (err) {
    res.status(500).send('Upload failed');
  }
});

app.listen(4000, () => console.log('Backend running on http://localhost:4000'));

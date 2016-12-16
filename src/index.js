'use strict';

const express = require('express');
const AWS = require('aws-sdk');
const fs = require('fs');
const multipart = require('connect-multiparty');

const app = express();

const port = process.env.PORT || 3000;
const bucket = process.env.BUCKET_NAME;

const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
const credentials = vcapServices['dynstrg'][0].credentials;

AWS.config.update({
  accessKeyId : credentials.accessKey,
  secretAccessKey: credentials.sharedSecret
});

const endpoint = new AWS.Endpoint(credentials.accessHost);

const s3Client = new AWS.S3({ endpoint: endpoint, signatureVersion: 'v2' });

app.get('/', (req, res) => {
  const paramsListPictures = { Bucket: bucket };
  s3Client.listObjects(paramsListPictures, (err, data) => {
    if (err) {
      console.error(err);
      res.send(err);
    } else {
      res.write(`
<html>
  <head>
    <style>
      img {
        float: left;
        padding: 10px;
      }

      .upload {
        border: 0;
        padding: 10px 20px;
        border-radius: 10px;
        background-color: #4488ee;
        color: white;
        font-size: 16px;
      }

      .upload:hover{
        background-color: #88aa44;
      }
    </style>

    <script>
      function uploadImage() {
        window.location.href = '/upload';
      }
    </script>
  </head>
  <body>
    <button class="upload" id="upload" onclick="uploadImage()">
      Choose an image to upload
    </button>
      `);

      data.Contents.forEach((item) => {
        const localKey = item.Key;
        getSignedUrl(bucket, localKey, 600, (err, url) => {
          if (err) {
            console.error(err);
            res.write(err);
          } else {
            res.write(`
    <div>
      <a href="${url}">
        <img src="${url}" style="width:300px; height:300px;">
      </a>
    </div>
            `);
          }
        });
      });
      res.end(`
  </body>
</html>
      `);
    }
  });
});

app.get('/upload', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end(`
<html>
    <body>
      <form action="/api/upload" method="post"
            enctype="multipart/form-data">
        <input type="file" name="pic">
        <input type="submit">
      </form>
    </body>
</html>
  `);
});

app.post('/api/upload', multipart(), (req,res) => {
  fs.readFile(req.files.pic.path, (err, data) => {
    const key = req.files.pic.originalFilename;
    const paramsCreateFile = { Bucket: bucket, Key: key, Body: data };

    s3Client.putObject(paramsCreateFile, (err, data) => {
      if (err) {
        console.error(err);
        res.send(err);
      } else {
        res.redirect('/');
      }
    });
  });
});

function getSignedUrl(bucket, key, durationInSeconds, callback) {
  const params = { Bucket: bucket, Key: key, Expires: durationInSeconds };
    s3Client.getSignedUrl('getObject', params, (err, url) => {
      if (err) {
        callback(err);
      } else {
        callback (null, url);
      }
  });
}

app.listen(port, () => {
  console.log('Application listening on port', port);
});

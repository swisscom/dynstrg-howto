"use strict";

const fs = require("fs");
const express = require("express");
const AWS = require("aws-sdk");
const multipart = require("connect-multiparty");

const app = express();

const port = process.env.PORT || 3000;
const bucket = process.env.BUCKET_NAME;

const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
const credentials = vcapServices["dynstrg"][0].credentials;

AWS.config.update({
  accessKeyId: credentials.accessKey,
  secretAccessKey: credentials.sharedSecret
});
const s3 = new AWS.S3({ endpoint: new AWS.Endpoint(credentials.accessHost) });

app.get("/upload", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <form
          action="/api/upload"
          method="post"
          enctype="multipart/form-data"
        >
          <input type="file" name="pic">
          <input type="submit">
        </form>
      </body>
    </html>
  `);
});

app.post("/api/upload", multipart(), (req, res) => {
  fs.readFile(req.files.pic.path, (err, data) => {
    const key = req.files.pic.originalFilename;
    const params = { Bucket: bucket, Key: key, Body: data };
    s3.putObject(params, (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).json(err);
        return;
      }
      res.redirect("/");
    });
  });
});

app.get("/", (req, res) => {
  s3.listObjects({ Bucket: bucket }, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json(err);
      return;
    }

    let resString = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            a {
              text-decoration: none;
            }
            img {
              padding: 6px;
              width: 250px;
              height: 250px;
            }
            .upload {
              border: none;
              padding: 10px 20px;
              background-color: #1781e3;
              color: white;
              font-size: 14px;
            }
            .upload:hover{
              background-color: #0851da;
            }
          </style>
        </head>
        <body>
    `;

    data.Contents.forEach(item => {
      const params = { Bucket: bucket, Key: item.Key, Expires: 600 };
      const url = s3.getSignedUrl("getObject", params);
      resString += `
        <a href="${url}">
          <img src="${url}" alt="${item.Key}">
        </a>
      `;
    });

    resString += `
          <br>
          <button class="upload" onclick="uploadImage()">
            Upload image
          </button>
          <script>
            function uploadImage() {
              window.location.href = "/upload";
            }
          </script>
        </body>
      </html>
    `;

    res.send(resString);
  });
});

app.listen(port, () => {
  console.log("Application listening on port", port);
});

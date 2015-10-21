/*
   Copyright 2015 Swisscom (Schweiz) AG
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var express = require('express'),
    app = express(),
    fs = require('fs'),
    multipart = require('connect-multiparty'),
    multipartMiddleware = multipart(),
    AWS = require('aws-sdk'),
    bucket = process.env.bucketName;

var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
var credentials = vcapServices['dynstrg'][0].credentials;

AWS.config.update({
	accessKeyId : credentials.accessKey,
	secretAccessKey: credentials.sharedSecret,
	region: "eu-west-1",
	httpOptions : {
		timeout : 180000 
	}
});

var endpoint = new AWS.Endpoint(credentials.accessHost);
var s3Client = new AWS.S3({endpoint: endpoint});
function getSignedUrl (bucket, key, timeInSeconds, callback){
  var params = {Bucket: bucket, Key: key,Expires: timeInSeconds};
    s3Client.getSignedUrl('getObject', params, function(err, url){
      if (err) {
        callback(err);
      } else {
        callback (null, url);
      }
  });
}

app.get('/upload', function(req, res){
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end("<html>"+
            "<body>"+
              "<form action='/upload' method='post' "+
                  "enctype='multipart/form-data'>"+
                "<input type='file' name='pic'>"+
                "<input type='submit'>"+
              "</form>"+
            "</body>"+
          "</html>");
})

app.post('/upload', multipartMiddleware, function(req,res){
  fs.readFile(req.files.pic.path, function (err, data) {
    var key = req.files.pic.originalFilename;
    var paramsCreateFile = {Bucket: bucket, Key: key, Body: data};
    s3Client.putObject(paramsCreateFile, function(error, data) {
      if (error) {
        console.log(error);
        res.send(error);
      } else {
        res.redirect("/");
      }
    });
  });
});

app.get('/', function(req, res) {
  var paramsListPictures = {Bucket: bucket};
  s3Client.listObjects(paramsListPictures, function(error, data) {
    if (error) {
      console.log(error);
      res.send(error);
    } else {
      res.write("<html>"+
                  "<body>"+
                    "<style>"+
                      "img{"+
                        "float:left;"+
                        "padding:10px;"+
                      "}"+
                      ".upload{"+
                        "border:0;"+
                        "padding:10px 20px;"+
                        "-moz-border-radius:10px;"+
                        "border-radius:10px;"+
                        "background-color:#4488ee;"+
                        "color:white;"+
                        "font-size:16px;"+
                      "}"+
                      ".upload:hover{"+
                        "background-color:#88aa44;"+
                      "}"+
                    "</style>"+
                    "<script>"+
                      "function deleteImage(event,key){"+
                        "if(event.button === 2){"+
                          "var r=confirm('DeleteImage?');"+
                          "if(r === true){"+
                          "window.location.href = '/deleteImage/'+key;"+
                          "}"+              
                        "}"+
                      "}"+
                      "function uploadImage(){"+
                        "window.location.href = '/upload';"+
                      "}"+
                    "</script>"+
                    "<button class='upload' id='upload 'onclick=uploadImage()>"+
                        "Choose an image to upload</button>"
                 );
      data.Contents.forEach(function(item){
        var localKey = item.Key;
        getSignedUrl (bucket, localKey, 600, function (error, url){
          if(!error){
            res.write("<div onmousedown=deleteImage(event,"+
                          "'"+localKey+"'"+");>"+
                        "<a href="+url+">"+
                        "<img src="+url+" width=300px height=300px>"+
                      "</a></div>");
          } else {
            res.write(error);
          }
        });
      });
      res.end("</body>"+
            "</html>");
    }
  });
});

app.get('/deleteImage/:key', function(req, res){
  var paramsDeletePicture = {Bucket: bucket, Key: req.params.key};
  s3Client.deleteObject(paramsDeletePicture, function(error, data){
    if (error) {
      res.send(error);
    } else {
      res.redirect('/');
    }
  });
});
var port = process.env.PORT || 3000;
app.listen(port);
console.log('Application listening on port '+port);

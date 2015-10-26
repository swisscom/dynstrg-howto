# Dynamic Storage HOW-TO
This document illustrates how to use the dynamic storage on the Swisscom Application Cloud. It is a step by step tutorial that will help to understand how to connect to the dynamic storage, and how to upload files to the storage. In particular this tutorial will show you how to create a simple node.js application to upload images to the dynamic storage, to visualize them, and to download them, as well as to delete them.

## Quick Start

For a quick start and deployment to Cloud Foundry, you can [download](https://github.com/swisscom/dynstrg-howto/archive/master.zip) this repo as it is. You have to modify the manifest.yml changing the name and the host of the application to avoid collision with a name already used. Also the bucket name should be changed and should be unique. Once you have modified the manifest, you have first to create a dynamic storage service with the name "dynstrg-album". This procedure is explained in detail [here](###Creating-a-dynamic-storage-service-instance-on-your-space).
Once the service is created you can deploy the application with the command:

    cf push

Then, you can create the bucket with the name you choosed before using [dragondisk](###Accessing-the-dynstrg-service-using-Dragondisk). Once the bucket is created you can start to use the application.

## Step by step tutorial

### Dynamic Storage S3 compatibility
The dynamic storage is a service S3 compatible. This means that it is possible to use it with applications built to use the aws S3 storage. In particular in this tutorial we will use [the aws S3 SDK for JavaScript in Node.js](https://aws.amazon.com/it/sdk-for-node-js/).

### Installing node.js
If you have node.js already installed on your computer, you can skip this section and go to the next one.
First of all download [node.js](https://nodejs.org/en/) and install it accordingly to your [system](https://nodejs.org/en/download/). Depending on your system you have to change the environment variables to include the node.js binary. At the end of the installation to test that everything is properly set up write the following command on the command line:

    node --version

The output should look as this:

    vx.x.x

If you get an error this means that the installation is not correct and you have to repeat the installation process.

### Creating an express simple application
For this tutorial we will use [express](http://expressjs.com/) and in particular the version 4. For future releases please refer to the express documentation page since some functions used in this tutorial could be obsolete. [This page](http://expressjs.com/starter/installing.html) offers a good starting point in how to set up our application. We follow the same steps for our tutorial.
First of all we create a directory for our application. We can call it "dynstrg-album". Depending on your system, create this directory and change the command line to it. Once on the directory level use the command:

    npm init

to create a file package.json. This command will prompt asking different things, like the name of the application and the entry point. You can use the name "app.js".
To install express use this command:

    npm install express --save

The command will install express on the directory with all the dependency and it will overwrite the file package.json adding the express dependency.

### Creating the file app.js
Choose your favourite text editor (you can use also your favourite IDE) and start a new file called app.js.
First of all we can create a local node.js server using express as shown in [this page](http://expressjs.com/starter/hello-world.html). The app starts a server on the host "localhost" and listen on the port 3000, it will respond with the "Hello World" on the route URL(/). For example opening a browser pointing at "http://localhost:3000" will show the message "Hello World!".
If this is working we can proceed to the deployment to [Cloud Foundry](https://www.cloudfoundry.org/), shown on the next section.
Here the code we use for our tutorial:

```javascript
var express = require('express'),
    app = express();
app.get('/', function(req, res){
  res.send("Hello World!")
});
var port = 3000;
app.listen(port);
console.log('Application listening on port '+port);
```

### Deploying the app to Cloud Foundry
In order to deploy the app to Cloud Foundry, a small modification must be made to the file app.js and a new file manifest.yml must be created. First of all
change the line:

```javascript
var port = 3000;
```
to the line:

```javascript
var port = process.env.PORT || 3000;
```
The environment variable [PORT](http://docs.run.pivotal.io/devguide/deploy-apps/environment-variable.html#PORT) is provided by Cloud Foundry. A manifest.yml file must be created on the same directory. The [manifest.yml](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html#minimal-manifest) is a file in YAML format that tells to Cloud Foundry which parameters to use for the application. The manifest for this first deployment to Cloud Foundry will look like this:

    ---
    path: .
    instances: 1
    memory: 512M
    applications:
    - name: dynstrg-album
    host: dynstrg-album
    command: node app.js
With this manifest, an application called dynstrg-album is deployed. To complete the deployment to Cloud Foundry, the [cli](https://github.com/cloudfoundry/cli/releases) must be installed on your computer.
With the command:

    cf push
The application is deployed to Cloud Foundry. If everything works fine at the address dystrg-album.domain you should get the message Hello World!
If instead an error is thrown the deployment step must be checked again.

### Creating a dynamic storage service instance on your space
First of all use the command:

    cf marketplace
to list the services available to your organization. You should see the service dynstrg with the plan "usage". To create a new dynstrg service instance use the command:

    cf create-service dynstrg usage dynstrg-album
with this command we created the new service instance called dynstrg-album. At this point the service can be bound to the application with the command:

    cf bind-service dynstrg-album dynstrg-album
and the app must be restaged with the command:

    cf restage dynstrg-album
Once restaged the service can be accessed using the environment variables [VCAP_SERVICES](http://docs.run.pivotal.io/devguide/deploy-apps/environment-variable.html#VCAP-SERVICES). For example for our application we can inspect this variable with the command:

    cf env dynstrg-album
and the output should look something like this:

```json
{
 "VCAP_SERVICES": {
  "dynstrg": [
    {
      "credentials": {
        "accessHost": "ds31s3.swisscom.com",
        "accessKey": "5484335148/CF_N_41C0E119_9BF3_4_C3B62A7B2473",
        "sharedSecret": "48CpiCjFCAItnQxeGoyc="
      },
      "label": "dynstrg",
      "name": "dynstrg-photos",
      "plan": "usage",
      "tags": [
       "dynstrg",
       "objectstore",
       "s3"
      ]
    }
  ]
 }
}

{
 "VCAP_APPLICATION": {
  "application_name": "dynstrg-album",
  "application_uris": [
   "dynstrg-album.scapp.io"
  ],
  "application_version": "5a4311a0c3-8d5f71764295",
  "limits": {
   "disk": 1024,
   "fds": 16384,
   "mem": 512
  },
  "name": "dynstrg-album",
  "space_id": "4855-950e-6ef13c072f16",
  "space_name": "DEV",
  "uris": [
    "dynstrg-album.scapp.io"
  ],
  "users": null,
  "version": "5a43118d5f71764295"
 }
}
```
To connect to the dynamic storage service the credentials object contains the informations needed to access it.

### <a name="Accessing-the-dynstrg-service-using-Dragondisk"></a> Accessing the dynstrg service using Dragondisk
[Dragondisk](http://www.dragondisk.com/) is a browser compatible with S3 storage systems. To install it you have to download the [correct version](http://www.dragondisk.com/download-amazon-s3-client-google-cloud-storage-client.html) for your system.
Once installed, open it and under File -> Accounts you can create a new Account. On the Provider choose "Other S3 compatible service", in the endpoint use the credentials accessHost, and for the Access Key the credentials accessKey, and for the Secret Key use the credentials sharedSecret. Choose the option connect using SSL/HTTPS. At this point you should be able to connect to the service. You can now create a new bucket that you will use to upload images to the dynamic storage. To do this, simply right click on the S3 service and choose Create Bucket. Since the dynamic storage uses a shared name system for the buckets it is a good choice to use a unique identifier name for the bucket.

### Modifying the manifest file adding the dynstrg service and the bucket name
Since we will modify the application many times and we will push it to Cloud Foundry many times, it would be time expensive to bind it to the service at every push, so it is best to add to the file manifest.yml the service we want to bind to the app and the environment variables we want the app uses.
The new manifest.yml file will look like this:

    ---
    path: .
    instances: 1
    memory: 512M
    services:
     - dynstrg-album
    applications:
    - name: dynstrg-album
      host: dynstrg-album
      command: node app.js
      env:
         bucketName: unique-identifier  

### Accessing the dynstrg service credentials

In node.js to access the credentials stored on the environment variable VCAP_SERVICES is simple. You have simply to add these line to the file app.js:

```javascript
var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
var credentials = vcapServices['dynstrg'][0].credentials;
```

### Aws S3 SDK client for dynamic storage
We will use the aws S3 SDK to interact with the dynamic storage service since this is fully compatible with the S3 service. The first thing to do is to import the module "aws-sdk". This can be done adding the line:

```javascript
var AWS = require('aws-sdk');
```
to the app.js file and at the same time running the command:

    npm install aws-sdk --save
to install the module in the current directory and saving the dependency on the file package.json. Then the imported module can be configured using the credentials variable we had created previously.

```javascript
AWS.config.update({
  accessKeyId : credentials.accessKey,
  secretAccessKey: credentials.sharedSecret,
  region: "eu-west-1",
  httpOptions : {
    timeout : 180000 
  }
});
    var endpoint = new AWS.Endpoint(credentials.accessHost);
```
The last operation is the creation of the S3 client adding this line:

```javascript
var s3Client = new AWS.S3({endpoint: endpoint});
```
This is all, the client is configured to use the credentials from the VCAP_SERVICES and it is initialized.

### Uploading files to the dynamic storage
In order to be able to upload local files to the dynamic storage, we have to use a node.js module called ["connect-multiparty"](https://www.npmjs.com/package/connect-multiparty). This module allows to post local files using a multipart approach. The built-in module "fs" must also be imported to be able to read the local file containing the image we want to upload. We have to create a HTML form that allows us to choose a file to upload. To do this we can simply use node.js to send dynamically a HTTP page containing a form:

```javascript
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
```
To handle this request that is a POST HTTP request we have to add a route "upload" that can receive HTTP POST requests. For this route we will use the "connect-multiparty" module.

```javascript
var multipart = require('connect-multiparty'),
    multipartMiddleware = multipart();
```
The bucket name can be retrieved through the environment variables.

```javascript
var bucket = process.env.bucketName;
```
This middleware can be used directly on the new route:

```javascript
app.post('/upload', multipartMiddleware, function(req,res){
  fs.readFile(req.files.pic.path, function (err, data) {
    var key = req.files.pic.originalFilename;
    var paramsCreateFile = {Bucket: bucket, Key: key, Body: data};
    s3Client.putObject(paramsCreateFile, function(error, data) {
      if (error) {
        console.log(error);
        res.send(error);
      } else {
        res.redirect("/upload");
      }
    });
  });
});
```
So the file will be uploaded to the dynamic storage using the method "putObject" provided by the aws S3 SDK.

### Checking if the file is correctly uploaded
Using dragondisk we can verify that the image was correctly uploaded to the bucket.

### Visualization of the uploaded images using the method getSignedUrl and deletion of an image using the right click of the mouse over the image
S3 allows to create a signed URL to share a specific file with another user. The same can be done with the dynamic storage using the aws S3 SDK. We used this method to visualize all the pictures we stored on dynstrg. First we have to create a function called getSignedUrl:

```javascript
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
```
This function allows to get a signed url using the parameters bucket name, key (the image to visualize), and the time in seconds that states the duration in seconds of the validity of the URL.

We can get all the images we store on the dynamic storage using the method listObjects. For each image we can get a signed URL and we can use this signed URL as a remote URL to visualize the image in a simple HTML img source tag. Adding some css style we can obtain a tile look for our image viewers.
The code to visualize all the stored images is this:

```javascript
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
```
As did before, we use node.js to send a dynamic HTML code. In this code we have embedded a css style. We simply use a <img src /> tag to visualize each stored image.
To be able to go back to the viewer after each upload we can change the line res.redirect("/upload") to res.redirect("/"). In this way every time we upload a new image we will see instantly the result on the album.

The code contains also the redirection to the URL "deleteImage/imageKey" to handle the deletion of an image. Using the right click event, the browser will redirect to the URL "/deleteImage/" and the name of the image will be passed as well through the URL. A simple express route can handle this request:

```javascript
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
```
The method deleteObject from the aws S3 SDK is used to delete the specified key. As soon the key is deleted the browser is redirected to the image viewer instantly showing all the images minus the deleted one.

## Code

You can find all the code used in this tutorial [here](https://github.com/swisscom/dynstrg-howto.git).





    


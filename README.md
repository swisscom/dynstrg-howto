# Dynamic Storage How To

This tutorial illustrates how to use Dynamic Storage on the Swisscom Application Cloud. It is a step by step guide that will help you understand how to connect to the service and how to upload files to it. In particular, this tutorial will show you how to create a simple Node.js application to upload images to Dynamic Storage, to visualize them and to download them. This tutorial is assuming that you have the [Cloud Foundry CLI](https://docs.developer.swisscom.com/cf-cli/install-go-cli.html) installed.

## Quick Start

If, instead of following the tutorial, you are looking for a quick start and deployment to Cloud Foundry, you can just `git clone` this repo. If you want to go through the tutorial, jump ahead to the "Step by step tutorial" section instead.

You'll have to modify the `manifest.yml` after cloning. Please change the `host` of the application to avoid collision with a name already used. Also, the bucket name should be changed to something unique. Once you have modified the manifest, you have to create a dynamic storage service with the name "dynstrg-album" which can be done with the following command:

```shell
$ cf create-service dynstrg usage dynstrg-album
```

Once the service is created, you can deploy the application with the command:

```shell
$ cf push
```

Then, you can create a bucket with the name you chose before using [DragonDisk](#accessing-the-dynstrg-service-using-dragondisk) or a similar tool. Once the bucket is created, you can start to use the application.

## Step by step tutorial

### Dynamic Storage S3 compatibility

Dynamic Storage is an S3 compatible service. This means that it is possible to use it with applications built to use the AWS S3 storage. Therefore, in this tutorial, we will use the [AWS SDK for Node.js](https://aws.amazon.com/it/sdk-for-node-js/).

### Install Node.js

If you already have Node.js installed on your computer, you can skip this section and go to the next one.
First of all, download [Node.js](https://nodejs.org/) and install it. At the end of the installation, to test that everything is set up properly, run the following command:

```shell
$ node --version
```

The output should look something like this:

```txt
vx.x.x
```

### Create a simple Express application

For this tutorial, we will use [Express](https://expressjs.com/). The [Express docs](https://expressjs.com/en/starter/installing.html) offer a good starting point on how to set up our application. We follow the same steps for our tutorial.
First of all, we create a directory for our application. Let's call it "dynstrg-album". Create this directory and change the command line to it. Once in the directory, use the command:

```shell
$ npm init --yes
```

to create a `package.json` file.

To install express use this command:

```shell
$ npm install --save express
```

This will install Express and add it to `package.json` as a dependency.

### Create server

Open your favorite text editor or IDE and create a new folder `src` and, inside, a file called `index.js`.

To get started, let's create a local Node.js server using Express as shown in the [Express docs](https://expressjs.com/en/starter/hello-world.html). The app starts a server on your "localhost" and listens on port 3000 which simply responds "Hello World".

To create your app, add the following code to your `index.js`:

```javascript
'use strict';

const express = require('express');

const app = express();

const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log('Application listening on port', port);
});
```

Then, switch to the `package.json` file and change `"scripts"` to the following:

```json
"scripts": {
  "start": "node src",
  "test": "echo \"Error: no test specified\" && exit 1"
},
```

You can also remove the `"main"` property since we won't be needing it.

Then you can run the following command to start your app:

```shell
$ npm start
```

### Deploy app to Cloud Foundry

In order to deploy the app to Cloud Foundry, a small modification must be made to `src/index.js` since we need to read the port from the environment:

Change the line:

```javascript
const port = 3000;
```

to

```javascript
const port = process.env.PORT || 3000;
```

The environment variable [PORT](https://docs.developer.swisscom.com/devguide/deploy-apps/environment-variable.html#PORT) is provided by Cloud Foundry.

Then we need to create a `manifest.yml` file in the root directory of our app. This YAML file tells Cloud Foundry which parameters to use for the application. Create the file and add the following content:

```yaml
---
applications:
- name: dynstrg-album
  host: dynstrg-album
  memory: 64M
  env:
    NODE_ENV: production
```

> You'll have to change the `host` to something unique. This is the hostname under which your app will be reachable.

With this manifest, an application called "dynstrg-album" will be deployed. Before we do that, we should add a `.cfignore` file at the root of our project. This works just like a `.gitignore` file but for pushing to Coud Foundry. Let's add `node_modules` so we don't push the dependencies. These are installed by Cloud Foundry anyways.

Then, push the app With the command:

```shell
$ cf push
```

the application is deployed to Cloud Foundry. You can now visit your app's URI and get a "Hello World" message.

### Create dynamic storage service instance

You can use the command

```shell
$ cf marketplace
```

to list the services available to your organization. You should see the service `dynstrg` with the plan `usage`. To create a new dynstrg service instance use the following command:

```shell
$ cf create-service dynstrg usage dynstrg-album
```

This creates a new service instance called "dynstrg-album". At this point, the service can be bound to the application with the command:

```shell
$ cf bind-service dynstrg-album dynstrg-album
```

Then restaged your app as suggested:

```shell
$ cf restage dynstrg-album
```

Once restaged, the service can be accessed using the environment variable [VCAP_SERVICES](https://docs.developer.swisscom.com/devguide/deploy-apps/environment-variable.html#VCAP-SERVICES). For our application, we can inspect this variable with the command

```shell
$ cf env dynstrg-album
```

Now we can dynamically access our service using the credentials object to access it.

### Access dynstrg with DragonDisk

[DragonDisk](http://www.dragondisk.com/) is a browser compatible with S3 storage systems. We'll use it to administer our S3 service. You can download it from their [website](http://www.s3-client.com/download-amazon-s3-client-google-cloud-storage-client.html).
Once installed, open it and under File -> Accounts you can create a new Account. For the provider, choose "Other S3 compatible service". For the endpoint, use the `credentials.accessHost`, for the Access Key, the `credentials.accessKey`, and for the Secret Key use the `credentials.sharedSecret`. Choose the option "Connect using SSL/HTTPS". At this point you should be able to connect to the service. You can now create a new bucket that you will use to upload images to the dynamic storage. To do that, simply right click on the S3 service and choose "Create Bucket". Since the dynamic storage uses a shared name system for buckets, you must use a unique identifier name for yours.

### Add service and bucket name to manifest

Since we will modify and deploy the app many times, we should add this information to `manifest.yml`.

The new file should look like this:

```yaml
applications:
- name: dynstrg-album
  host: dynstrg-album
  memory: 64M
  services:
  - dynstrg-album
  env:
    NODE_ENV: production
    BUCKET_NAME: my-unique-bucket
```

### Access service credentials

In Node.js, to access the credentials stored on the environment variable `VCAP_SERVICES` is simple. You simply have to add these line to the file `src/index.js` right after the port is set:

```javascript
const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
const credentials = vcapServices['dynstrg'][0].credentials;
```

### Add AWS S3 SDK

We will use the AWS S3 SDK to interact with the dynamic storage service since it is fully compatible with our service. The first thing to do is to import the `aws-sdk` package. This can be done by adding the line

```javascript
const AWS = require('aws-sdk');
```

to the top of the `src/index.js` file and at then running the command

```shell
$ npm install --save aws-sdk
```

to install the package in the current directory and save the dependency to `package.json`. Then, the imported package can be configured using the credentials variable we had created previously. Add these lines to `src/package.jon` right after `credentials` is defined:

```javascript
AWS.config.update({
  accessKeyId : credentials.accessKey,
  secretAccessKey: credentials.sharedSecret
});

const endpoint = new AWS.Endpoint(credentials.accessHost);
```

The last operation is the creation of the S3 client. Add this line right after the above ones:

```javascript
const s3Client = new AWS.S3({ endpoint: endpoint, signatureVersion: 'v2' });
```

That's it. The client is configured to use the credentials from the `VCAP_SERVICES` and it is initialized. In the last command we used the config `signatureVersion: 'v2'` because our service needs this version in order to accept requests.

### Upload files

In order to be able to upload local files to the dynamic storage, we use the package [connect-multiparty](https://www.npmjs.com/package/connect-multiparty). This module allows to upload local files using a multipart approach. The native module "fs" must also be imported to be able to read the local file containing the image we want to upload. Let's install and add these packages by running the following command:

```shell
$ npm install --save connect-multiparty
```

Then add the two packages to the top of our `src/index.js` file:

```javascript
const fs = require('fs');
const multipart = require('connect-multiparty');
```

Now we have to create an HTML form that allows us to choose a file to upload. To do that, we can simply use Node.js to send an HTML page containing a form. Add these lines to your file right after the root route is handled:

```javascript
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
```

To handle the POST HTTP request coming from the form, we have to add another route that can receive HTTP POST requests. For this route, we will use the "connect-multiparty" module.

The bucket name can be retrieved through the environment variables. To do so, add this line to where you set the `port`:

```javascript
const bucket = process.env.BUCKET_NAME;
```

Our new middleware middleware can be used directly on the new route. Add it to your route definitions:

```javascript
app.post('/api/upload', multipart(), (req,res) => {
  fs.readFile(req.files.pic.path, (err, data) => {
    const key = req.files.pic.originalFilename;
    const paramsCreateFile = { Bucket: bucket, Key: key, Body: data };

    s3Client.putObject(paramsCreateFile, (err, data) => {
      if (err) {
        console.error(err);
        res.send(err);
      } else {
        res.redirect('/upload');
      }
    });
  });
});
```

Now the file will be uploaded to the dynamic storage using the method `putObject` provided by the AWS S3 SDK. Let's redeploy our app to cloud foundry and try it out at `/upload`:

```shell
$ cf push
```

### Check if the file was uploaded correctly

Using DragonDisk, we can verify that the picture was correctly uploaded to the bucket.

### Visualize uploaded images

S3 allows to create a signed URL to share a specific file with another user. The same can be done with our dynamic storage using the AWS S3 SDK. We will use this method to visualize all the pictures we have stored on dynstrg. Let's add a function that does so to right after the route definitions:

```javascript
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
```

This function allows to get a signed url using the bucket name, the key (the image to visualize), and the duration of the validity of the URL in seconds.

We can get all the images we store in the dynamic storage using the method `listObjects`. For each image, we can get a signed URL and we can use this signed URL as a remote URL to visualize the image in a simple HTML `<img>` source tag. By adding some CSS styles, we can achieve a tile look for our image viewers.

The code to visualize all the stored images is below. Replace the current definition of the root route with it.

```javascript
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
```

As before, we use Node.js to send dynamic HTML code. In this code we have embedded some CSS styles. We simply use an `<img>` tag to visualize each stored image.

## Code

You can find all the code used in this tutorial [here](https://github.com/swisscom/dynstrg-howto.git).

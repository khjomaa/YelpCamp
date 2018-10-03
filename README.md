# [YelpCamp](https://khalil-yelpcamp.herokuapp.com/)

### Introduction
This project is an exmaple of fullstack website.

This project is implemented by Node.js, HTML, CSS and Bootstrap

### Description
The web site allow registered user to add posts about campground places in the world.
Every registered user can add comments for every post.

### Requirements
1. Gmail account which will be used for sending forgot password email.
2. Account on [Cloudinary](https://cloudinary.com/) for uploading images
3. [MongoDB](https://www.mongodb.com/) database
4. An account on [Google developers](https://console.cloud.google.com) with API for Maps and Geocode 

If you want to deploy the website on sites like Heroku you need to create a MongoDB account on the cloud (like [mLab](https://mlab.com/))
 

###  Install the dependencies
Run the command `npm i`


### Start the server
`node app.js`

OR `nodemon app.js`

This will launch a server at port 3000. If port is used, you can set a different one.

### Environment Variables
On MAC
* `export PASSPORT_SECRET=<your secret key>`
* `export CLOUDINARY_API_KEY=<Cloudinray API Key>`
* `export CLOUDINARY_API_SECRET=<Cloudinary API Secret>`
* `export CLOUDINARY_NAME=<Cloudinary cloud name>`
* `export CLOUDINARY_FOLDER=<Folder path in cloudinary>`
* `export GEOCODER_API_KEY=<Google Geocode API Key>`
* `export GMAIL_ACCOUNT=<your gmail>`
* `export GMAILPW=<gmail password>`
* `export DB_NAME=<DB Name in MongoDB for running locally>`
* `export DATABASE_URL=<mLab DB URL>`


On Windows:
Just replace export with set
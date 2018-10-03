let express = require("express");
let router = express.Router();
let Campground = require("../models/campground");
let middleware = require("../middleware");
let multer = require('multer');
let cloudinary = require('cloudinary');

let storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});

let imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

let upload = multer({storage: storage, fileFilter: imageFilter});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


let NodeGeocoder = require('node-geocoder');
let options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};
let geocoder = NodeGeocoder(options);


// INDEX - show all campgrounds
router.get("/", function (req, res) {
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, function (err, allCampgrounds) {
            if(err){
                console.log(err);
            } else {
                if(allCampgrounds.length < 1){
                    req.flash("info", "No campgrounds found with the name: " + req.query.search);
                    res.redirect("/campgrounds");
                } else {
                    res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds'});
                }
            }
        });
    } else {
        Campground.find({}, function (err, allCampgrounds) {
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds'});
            }
        });
    }
});

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {

    geocoder.geocode(req.body.location, function (err, data) {

        if(err || !data.length){
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }

        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;

        cloudinary.v2.uploader.upload(req.file.path, {folder: process.env.CLOUDINARY_FOLDER, use_filename: true}, function (err, result) {
            if(err){
                req.flash('error', err.message);
                return res.redirect('back');
            }

            req.body.campground.image = result.secure_url;
            req.body.campground.imageId = result.public_id;
            req.body.campground.author = {
                id: req.user._id,
                username: req.user.username
            };

            Campground.create(req.body.campground, function (err, newlyCreated) {
                if(err){
                    console.log(err);
                    req.flash("error", err.message);
                    return res.redirect("back");
                } else {
                    req.flash("success", "Campground " + req.body.campground.name + " created successfully");
                    res.redirect("/campgrounds");
                }
            });
        });
    });
});

router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new") ;
});

router.get("/:id", function (req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if(err || !foundCampground){
            console.log(err);
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

router.get("/:id/edit", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if(err){
            req.flash("error", "Campground not found");
            console.log(err);
        } else {
        }
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

router.put("/:id", upload.single('image'), middleware.checkCampgroundOwnership, function (req, res) {
    geocoder.geocode(req.body.location, function (err, data) {
       if(err || !data.length){
           req.flash('error', 'Invalid address');
           return res.redirect('back');
       }

       Campground.findById(req.params.id, async function (err, updatedCampground) {
          if(err){
              req.flash("error", err.message);
              res.redirect("/back");
          } else {
              if(req.file){
                  try{
                      await cloudinary.v2.uploader.destroy(updatedCampground.imageId);
                      let result = await cloudinary.v2.uploader.upload(req.file.path, {folder: process.env.CLOUDINARY_FOLDER, use_filename: true});
                      updatedCampground.imageId = result.public_id;
                      updatedCampground.image = result.secure_url;
                  } catch (err) {
                      req.flash("error", err.message);
                      return res.redirect("back");
                  }
              }

              updatedCampground.name = req.body.campground.name;
              updatedCampground.price = req.body.campground.price;
              updatedCampground.description = req.body.campground.description;
              updatedCampground.lat = data[0].latitude;
              updatedCampground.lng = data[0].longitude;
              updatedCampground.location = data[0].formattedAddress;

              updatedCampground.save();

              req.flash("success", "Campground updated successfully");
              res.redirect("/campgrounds/" + req.params.id);
          }
       });
    });
});

router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, async function (err, campground) {
        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
        
        try{
            await cloudinary.v2.uploader.destroy(campground.imageId);
            campground.remove();
            req.flash("success", "Campground deleted");
            res.redirect("/campgrounds");
        } catch (err) {
            if(err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
var express = require('express');
var router = express.Router();

// Multer
var multer = require('multer');
var path = require('path');

// Multer storage engine
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});


// Models
var Recipe = require('../models/recipe');
var User = require('../models/user');




// Create recipe
router.get('/create-recipe', isLoggedIn(), function(req, res) {
    User.findById(req.user.user_id, function(error, user){
        res.render('create-recipe', { title: 'Create recipe', user: user });
    });
});

router.post('/create-recipe', upload.single('image'), function(req, res) {

    // errors.push({"location":"body","param":"image","msg": "# Please upload an image file (.jpeg, .jpg, .png, .gif).","value":undefined});


    req.checkBody('title', '# Recipe must have a title.').notEmpty();
    req.checkBody('title', '# Recipe title must be between 4-100 characters long.').len(4, 100);
    req.checkBody('description', '# Recipe must have a description.').notEmpty();
    req.checkBody('step1', '# Recipe must have at least one step.').notEmpty();
    req.checkBody('recipeTimeHrs', '# Recipe must have a time.').notEmpty();
    req.checkBody('recipeTimeMins', '# Recipe must have a time.').notEmpty();
    req.checkBody('difficulty', '# Recipe must have a difficulty.').notEmpty();
    req.checkBody('serves', '# Recipe must include how many people it serves.').notEmpty();

    const errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        User.findById(req.user.user_id, function(error, user){
            res.render('create-recipe', { title: 'Create recipe', errors: errors, user: user });
        });
    } else {

        User.findById(req.user.user_id, function(error, doc) {

            var recipeTitle = req.body.title;
            var recipeDescription = req.body.description;
            var recipeSteps = req.body.step1;
            var recipeAuthor = doc.username;
            var recipePublished = Date.now();
            var recipeTimeHrs = req.body.recipeTimeHrs;
            var recipeTimeMins = req.body.recipeTimeMins;
            var recipeDifficulty = req.body.difficulty;
            var recipeServes = req.body.serves;

            // if (recipeServes == 1) {
            //     recipeServes = recipeServes.toString() + " person";
            // } else {
            //     recipeServes = recipeServes.toString() + " people";
            // }

            var recipeImage = req.file.path;



            var recipe = new Recipe ({
                title: recipeTitle,
                description: recipeDescription,
                steps: recipeSteps,
                author: recipeAuthor,
                published: recipePublished,
                recipeTimeHrs: recipeTimeHrs,
                recipeTimeMins: recipeTimeMins,
                difficulty: recipeDifficulty,
                serves: recipeServes,
                image: recipeImage
            });

            recipe.save(function(error, myrecipe) {
                if (error) throw error;

                console.log('recipe created!');

                res.redirect('/');
            });
        });
    }
});

router.get('/:recipeid', function(req, res) {
    var recipeId = req.params.recipeid;

    Recipe.findById(recipeId, function(error, doc) {
        if (error) throw error;

        if (req.user) {
            User.findById(req.user.user_id, function(error, user) {
                if (error) throw error;
                res.render('recipe', { title: doc.title, recipe: doc, user: user });
            });
        } else {
            res.render('recipe', { title: doc.title, recipe: doc });
        }
    });
});

router.get('/:recipeid/delete', isLoggedIn(), function(req, res) {

    var recipeId = req.params.recipeid;

    Recipe.findById(recipeId, function(error, doc) {
        if (error) throw error;
        User.findById(req.user.user_id, function(error, user) {
            if (error) throw error;
            if (user.username == doc.author) {
                Recipe.deleteOne({ _id: recipeId}, function(error) {
                    if (error) throw error;

                    res.redirect('/');
                });
            } else {
                res.redirect('/recipe/' + recipeId);
            }
        });
    });
});

router.get('/:recipeid/edit', isLoggedIn(), function(req, res) {
    var recipeId = req.params.recipeid;

    Recipe.findById(recipeId, function(error, doc) {
        if (error) throw error;
        User.findById(req.user.user_id, function(error, user) {
            if (error) throw error;
            if (user.username == doc.author) {
                res.render('edit-recipe', { title: 'Edit Recipe', recipe: doc, user: user });
            } else {
                res.redirect('/recipe/' + recipeId);
            }
        });
    });
});

router.post('/:recipeid/edit', upload.single('image'), function(req, res) {

    var recipeId = req.params.recipeid;

    req.checkBody('title', '# Recipe must have a title.').notEmpty();
    req.checkBody('title', '# Recipe title must be between 4-100 characters long.').len(4, 100);
    req.checkBody('description', '# Recipe must have a description.').notEmpty();
    req.checkBody('step1', '# Recipe must have at least one step.').notEmpty();
    req.checkBody('recipeTimeHrs', '# Recipe must have a time.').notEmpty();
    req.checkBody('recipeTimeMins', '# Recipe must have a time.').notEmpty();
    req.checkBody('difficulty', '# Recipe must have a difficulty.').notEmpty();
    req.checkBody('serves', '# Recipe must include how many people it serves.').notEmpty();

    const errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        Recipe.findById(recipeId, function(error, doc){
            User.findById(req.user.user_id, function(error, user){
                res.render('edit-recipe', { title: 'Edit recipe', errors: errors, user: user, recipe: doc });
            });
        });

    } else {

        Recipe.findById(recipeId, function(error, oldDoc) {
            if (error) throw error;

            oldDoc.title = req.body.title;
            oldDoc.description = req.body.description;
            oldDoc.steps = req.body.step1;
            oldDoc.published = Date.now();
            oldDoc.recipeTimeHrs = req.body.recipeTimeHrs;
            oldDoc.recipeTimeMins = req.body.recipeTimeMins;
            oldDoc.difficulty = req.body.difficulty;
            oldDoc.serves = req.body.serves;

            // if (recipeServes == 1) {
            //     recipeServes = recipeServes.toString() + " person";
            // } else {
            //     recipeServes = recipeServes.toString() + " people";
            // }

            if (req.file) {
                oldDoc.image = req.file.path;
            }

            oldDoc.save(function(error, updatedDoc) {
                if (error) throw error;

                console.log('Recipe created!');

                res.redirect('/recipe/' + recipeId);
            });
        });
    }
});




function isLoggedIn() {
    return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

        if (req.isAuthenticated()) return next();
        res.redirect('/user/login')
    }
}

function notLoggedIn() {
    return (req, res, next) => {

        if (!req.isAuthenticated()) return next();
        res.redirect('/')
    }
}

module.exports = router;

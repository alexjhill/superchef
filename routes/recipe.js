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
    req.checkBody('recipeTime', '# Recipe must have a time.').notEmpty();
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
            var recipeTime = req.body.recipeTime + " mins";
            var recipeDifficulty = req.body.difficulty;
            var recipeServes = req.body.serves;

            if (recipeServes == 1) {
                recipeServes = recipeServes.toString() + " person";
            } else {
                recipeServes = recipeServes.toString() + " people";
            }

            var recipeImage = req.file.path;



            var recipe = new Recipe ({
                title: recipeTitle,
                description: recipeDescription,
                steps: recipeSteps,
                author: recipeAuthor,
                published: recipePublished,
                recipeTime: recipeTime,
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
        res.render('recipe', { title: doc.title, recipe: doc });
    });
});

router.get('/:recipeid/delete', function(req, res) {

    var recipeId = req.params.recipeid;

    Recipe.deleteOne({ _id: recipeId}, function(error) {
        if (error) throw error;

        res.redirect('/');
    });
});

router.get('/:recipeid/edit', function(req, res) {
    var recipeId = req.params.recipeid;

    Recipe.findById(recipeId, function(error, doc) {
        if (error) throw error;
        console.log(doc);
        res.render('edit-recipe', { title: 'Edit Recipe', recipe: doc });
    });

});

router.post('/:recipeid/edit', function(req, res) {

    var recipeId = req.params.recipeid;

    req.checkBody('title', 'Recipe must have a title.').notEmpty();
    req.checkBody('title', 'Recipe title must be between 4-100 characters long.').len(4, 100);

    req.checkBody('body', 'Recipe must have some content.').notEmpty();

    const errors = req.validationErrors();

    if (errors) {

        res.render('edit-recipe', {
            title: 'Recipe Error',
            errors: errors
        });
    } else {

        recipe.findById(recipeId, function(error, oldDoc) {
            if (error) throw error;

            oldDoc.title = req.body.title;
            oldDoc.body = req.body.body;
            oldDoc.published = Date.now();

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

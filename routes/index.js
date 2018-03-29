var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/user');
var Article = require('../models/article');

var expressValidator = require('express-validator');
var passport = require('passport');
var bcrypt = require('bcrypt');

const saltRounds = 10;

router.get('/', function(req, res){
    console.log(req.user);
    console.log(req.isAuthenticated());

    Article.find( function(error, docs) {
        res.render('home', { title: 'Home', articles: docs });
    });
});


// Home
router.get('/get-data', isLoggedIn(), function(req, res) {
    Article.find().then(function(doc) {
        res.render('home', {items: doc});
    });
});


// Profile
router.get('/profile', isLoggedIn(), function(req, res) {
    res.render('profile', { title: 'Profile' });
});



// Logout
router.get('/logout', isLoggedIn(), function(req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});


// Create article
router.get('/create-article', isLoggedIn(), function(req, res) {
    res.render('create-article', { title: 'Create Article' });
});

router.post('/create-article', function(req, res) {
    req.checkBody('title', 'Article must have a title.').notEmpty();
    req.checkBody('title', 'Article title must be between 4-100 characters long.').len(4, 100);

    req.checkBody('body', 'Article must have some content.').notEmpty();

    const errors = req.validationErrors();

    if (errors) {
        console.log('errors, ${JSON.stringify(errors)}');


        res.render('create-article', {
            title: 'Article Error',
            errors: errors
        });
    } else {


        var articleTitle = req.body.title;
        var articleBody = req.body.body;
        var articleAuthor = req.user.user_id;
        var articlePublished = Date.now();

        var article = new Article ({
            title: articleTitle,
            body: articleBody,
            author: articleAuthor,
            published: articlePublished
        });

        article.save(function(error, myArticle) {
            if (error) throw error;

            console.log('article created!');

            res.redirect('/');
        });
    }


});



// Login
router.get('/login', notLoggedIn(), function(req, res) {

    const flashMessages = res.locals.getMessages();
    console.log('flash', flashMessages);

    if (flashMessages.error) {
        res.render('login', {
            title: 'Login error',
            showErrors: true,
            errors: flashMessages.error
        })
    } else {
        res.render('login', { title: 'Login' });
    }
});


router.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    badRequestMessage: 'Please enter a username and password.',
    failureFlash: true
}));



// Register
router.get('/register', notLoggedIn(), function(req, res) {

    const flashMessages = res.locals.getMessages();
    console.log('flash', flashMessages);

    if (flashMessages.error) {
        res.render('register', {
            title: 'Registration error',
            showErrors: true,
            errors: flashMessages.error
        })
    } else {
        res.render('register', { title: 'Registration' });
    }
});

router.post('/register', function(req, res, next) {

    req.checkBody('name', 'Name field cannot be empty.').notEmpty();
    req.checkBody('name', 'Name field must be between 4-15 characters long.').len(4, 15);

    req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
    req.checkBody('email', 'Email address must be between 5-100 characters long, please try again.').len(5, 100);

    req.checkBody('username', 'Username field cannot be empty.').notEmpty();
    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);

    req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody("password", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");

    req.getValidationResult().then(function(result) {
        if (result.isEmpty() === false) {
            result.array().forEach((error) => {
                req.flash('error', error.msg);
            })
            res.redirect('/register');
        } else {

            var myName = req.body.name;
            var myEmail = req.body.email;
            var myUsername = req.body.username;
            var myPassword = req.body.password;


            bcrypt.hash(myPassword, saltRounds, function(err, hash) {

                var user = new User ({
                    name: myName,
                    email: myEmail,
                    username: myUsername,
                    password: hash
                });

                user.save(function(error, myUser) {
                    if (error) {
                        if(error.message.indexOf('duplicate key error') > -1) {
                            req.flash('error', 'Username already taken.');
                        } else {
                            req.flash('error', 'There was a problem with your registration.');
                        }
                        res.redirect('/register');
                    } else {
                        const user_id = myUser._id;

                        console.log('user created!');

                        req.login(user_id, function(error) {
                            if(error) throw error;
                            res.redirect('/');
                        });
                    }
                })
            })
        }
    })
});

passport.serializeUser(function(user_id, done) {
    done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});

function isLoggedIn() {
    return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

        if (req.isAuthenticated()) return next();
        res.redirect('/login')
    }
}

function notLoggedIn() {
    return (req, res, next) => {

        if (!req.isAuthenticated()) return next();
        res.redirect('/')
    }
}

module.exports = router;

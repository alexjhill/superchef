var express = require('express');
var router = express.Router();

var User = require('../models/user');

var expressValidator = require('express-validator');
var passport = require('passport');
var bcrypt = require('bcrypt');

const saltRounds = 10;

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
    successRedirect: '/user/profile',
    failureRedirect: '/user/login',
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
            res.redirect('/user/register');
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
                        res.redirect('/user/register');
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


router.get('/:userid', function(req, res) {
    var userId = req.params.userid;

    User.findById(userId, function(error, doc) {
        if (error) throw error;
        res.render('profile', { title: doc.username, user: doc });
    });
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

passport.serializeUser(function(user_id, done) {
    done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});

module.exports = router;

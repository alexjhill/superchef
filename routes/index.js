var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/user');

var expressValidator = require('express-validator');
var passport = require('passport');

var bcrypt = require('bcrypt');

const saltRounds = 10;

router.get('/', function(req, res){
    console.log(req.user);
    console.log(req.isAuthenticated());
    res.render('home', { title: 'Home' });
});


router.get('/profile', authenticationMiddleware(), function(req, res) {
    res.render('profile', { title: 'Profile' });
});


// Login
router.get('/login', function(req, res) {
    res.render('login', { title: 'Login' });
});


router.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login'
}));



// Logout
router.get('/logout', function(req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});





// Register
router.get('/register', function(req, res) {
    res.render('register', { title: 'Registration' });
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

    const errors = req.validationErrors();

    if (errors) {
        console.log('errors, ${JSON.stringify(errors)}');


        res.render('register', {
            title: 'Registration Error',
            errors: errors
        });
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
                if (error) throw error;

                const user_id = myUser._id;

                console.log('user created!');

                req.login(user_id, function(err) {
                    res.redirect('/');
                });
            });
        });
    }
});

passport.serializeUser(function(user_id, done) {
    done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});

function authenticationMiddleware () {
    return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

        if (req.isAuthenticated()) return next();
        res.redirect('/login')
    }
}

module.exports = router;

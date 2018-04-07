var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/user');
var Recipe = require('../models/recipe');

var expressValidator = require('express-validator');
var bcrypt = require('bcrypt');

router.get('/', function(req, res){
    console.log(req.user);
    console.log(req.isAuthenticated());

    Recipe.find( function(error, docs) {
        if (error) throw error;

        if (req.user) {
            User.findById(req.user.user_id, function(error, user) {
                if (error) throw error;
                res.render('home', { title: 'Home', recipes: docs, user: user });
            });
        } else {
            res.render('home', { title: 'Home', recipes: docs });
        }
    });
});


module.exports = router;

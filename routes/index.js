var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Article = require('../models/article');

var expressValidator = require('express-validator');
var bcrypt = require('bcrypt');

router.get('/', function(req, res){
    console.log(req.user);
    console.log(req.isAuthenticated());

    Article.find( function(error, docs) {
        if (error) throw error;
        res.render('home', { title: 'Home', articles: docs });
    });
});


module.exports = router;

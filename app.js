// browser-sync start --proxy "localhost:8000" --files "views/partials/*.hbs, views/*.hbs, public/css/*.css"

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');



// MONGODB SETUP
var mongoose = require('mongoose');
var User = require('./models/user');

mongoose.connect('mongodb://alexjhill:password@ds121118.mlab.com:21118/linear');
var db = mongoose.connection;

// Check connection
db.once ('open', function() {
    console.log("Connected to MongoDB");
});

// Check for db errors
db.on ('error', function(err){
    console.log(err);
});



var indexRouter = require('./routes/index');


// AUTHENTICATION SETUP
var expressValidator = require('express-validator');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var MongoStore = require('connect-mongo')(session);
var bcrypt = require('bcrypt');


var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'agsdhsdfqeqefvsdvsdv',
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
    store: new MongoStore({ mongooseConnection: db }),
    cookie: { maxAge: 180 * 60 * 1000 }
}))
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

app.use('/', indexRouter);

passport.use(new LocalStrategy(
    function(username, password, done) {

        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false);
            } else {
                const hash = user.password;

                bcrypt.compare(password, hash, function(err, response){
                    if (response === true) {
                        return done(null, {user_id: user._id});
                    } else {
                        return done(null, false);
                    }
                });
            }


        })
    }
));


app.use(function(req, res, next) {
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


// Handlebars default config
const hbs = require('hbs');
const fs = require('fs');




const partialsDir = __dirname + '/views/partials';
const partialsFiles = fs.readdirSync(partialsDir);

partialsFiles.forEach(function (filename) {
    const matches = /^([^.]+).hbs$/.exec(filename);
    if (!matches) {
        return;
    }
    const name = matches[1];
    const template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
    hbs.registerPartial(name, template);
});

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context, null, 2);
});



const modelsDir = __dirname + '/models';
const modelsFiles = fs.readdirSync(modelsDir);

modelsFiles.forEach(function (filename) {
    if (~filename.indexOf('.js')) require(modelsDir + '/' + filename);
});




module.exports = app;

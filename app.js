// browser-sync start --proxy "localhost:8000" --files "views/partials/*.hbs, views/*.hbs, public/css/*.css"

var createError = require('http-errors')
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash-messages');




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
var userRouter = require('./routes/user');
var articleRouter = require('./routes/article');



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
app.use(flash())


// Session validation
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

app.use('/user', userRouter);
app.use('/article', articleRouter);
app.use('/', indexRouter);

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function (error, user) {
            if (error) { return done(error); }
            if (!user) {
                return done(null, false, {message: 'Username does not exist.'});
            } else {
                const hash = user.password;

                bcrypt.compare(password, hash, function(err, response){
                    if (response === true) {
                        return done(null, {user_id: user._id});
                    } else {
                        return done(null, false, {message: 'Incorrect password.'});
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



app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
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

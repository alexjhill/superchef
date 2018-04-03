var express = require('express');
var router = express.Router();

var Article = require('../models/article');

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
        var articleAuthor = req.user;
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

router.get('/:articleid', function(req, res) {
    var articleId = req.params.articleid;

    Article.findById(articleId, function(error, doc) {
        if (error) throw error;
        res.render('article', { title: doc.title, article: doc });
    });
});

router.get('/:articleid/delete', function(req, res) {

    var articleId = req.params.articleid;

    Article.deleteOne({ _id: articleId}, function(error) {
        if (error) throw error;

        res.redirect('/');
    });
});

router.get('/:articleid/edit', function(req, res) {
    console.log('penis');
    var articleId = req.params.articleid;

    Article.findById(articleId, function(error, doc) {
        if (error) throw error;
        console.log(doc);
        res.render('edit-article', { title: 'Edit Article', article: doc });
    });

});

router.post('/:articleid/edit', function(req, res) {

    var articleId = req.params.articleid;

    req.checkBody('title', 'Article must have a title.').notEmpty();
    req.checkBody('title', 'Article title must be between 4-100 characters long.').len(4, 100);

    req.checkBody('body', 'Article must have some content.').notEmpty();

    const errors = req.validationErrors();

    if (errors) {
        console.log('errors, ${JSON.stringify(errors)}');


        res.render('edit-article', {
            title: 'Article Error',
            errors: errors
        });
    } else {

        Article.findById(articleId, function(error, oldDoc) {
            if (error) throw error;
            
            oldDoc.title = req.body.title;
            oldDoc.body = req.body.body;
            oldDoc.published = Date.now();

            oldDoc.save(function(error, updatedDoc) {
                if (error) throw error;

                console.log('article created!');

                res.redirect('/article/' + articleId);
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

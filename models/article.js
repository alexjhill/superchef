var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var articleSchema = new Schema({
    title: {type: String, required: true},
    body: {type: String, required: true},
    author: {type: String, required: true},
    published: {type: Date, default: Date.now(), required: true}
},{ collection: 'articles' });

var Article = module.exports = mongoose.model('Article', articleSchema);

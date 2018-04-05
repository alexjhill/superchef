var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var recipeSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    steps: [{type: String}],
    author: {type: String, required: true},
    published: {type: Date, default: Date.now(), required: true},
    recipeTime: {type: String, required: true},
    difficulty: {type: String, required: true},
    serves: {type: String, required: true},
    image: {type: String, required: true}
},{ collection: 'recipes' });

var Recipe = module.exports = mongoose.model('Recipe', recipeSchema);

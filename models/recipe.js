var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var recipeSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    steps: [
        {type: String, required: true}
    ],
    author: {type: String, required: true},
    published: {type: Date, default: Date.now(), required: true},
    recipeTimeHrs: {type: String, required: true},
    recipeTimeMins: {type: String, required: true},
    difficulty: {type: String, required: true},
    serves: {type: String, required: true},
    image: {type: String, required: true},
    favouritesCounter: {type: Number, default: 0}
},{ collection: 'recipes' });

var Recipe = module.exports = mongoose.model('Recipe', recipeSchema);

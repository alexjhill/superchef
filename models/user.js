var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    username: {type: String, required: true, index: true, unique: true},
    password: {type: String, required: true}
},{ collection: 'users' });

var User = module.exports = mongoose.model('User', userSchema);

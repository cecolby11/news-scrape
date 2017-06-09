// require mongoose
var mongoose = require('mongoose');
// create a schema class
var Schema = mongoose.Schema;
// create comment schema
var CommentSchema = new Schema({
  author: {
    type: String,
    required: true, 
    
  }, 
  body: {
    type: String
  }, 
  datetime: {
    type: Date,
    default: Date.now
  }
});

// create the Comment model from the schema 
var Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;
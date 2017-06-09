// require mongoose 
var mongoose = require('mongoose');
// create schema class
var Schema = mongoose.Schema;
// create article schema 
var ArticleSchema = new Schema({
  headline: {
    type: String,
    required: true, 
    unique: true // avoid adding duplicates
  },
  link: {
    type: String,
    required: true, 
    unique: true // avoid adding duplicates
  },
  author: {
    type: String
  },
  datetime: {
    type: Date
  },
  savedToDb: {
    type: Boolean,
    default: false
  },
  // comments is an array that stores objectIds linked to comments (comment contents get populated in server.js routes using mongoose populate)
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }]
});

// Create the Article model from the schema 
var Article = mongoose.model('Article', ArticleSchema);

module.exports = Article;
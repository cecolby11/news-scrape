// =============
// DEPENDENCIES
// =============

var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
// database
var mongoose = require('mongoose');
// scraping
var request = require('request');
var cheerio = require('cheerio');
// models
var Article = require('./models/Article.js');
var Comment = require('./models/Comment.js');

// ============
// SERVER SETUP
// ============

var app = express();

// ============
// APP CONFIG
// ============

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// body parser setup
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));


// config db with mongoose
mongoose.connect("mongodb://localhost/week18day3mongoose");
var db = mongoose.connection;
// log mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});
// establish connection and display success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// =======
// ROUTES
// =======

app.get('/', function(req, res) {
  res.redirect('/articles');
});

// GET : 
// 1. scrape news website 
// 2. check for duplicates
// 3. save non-duplicates to db
// 4. display news content from db 
app.get('/articles', function(req, res) {
  res.send('view all articles!');
});

// GET : view a single article by id and all of its associated comments
app.get('/articles/:id', function(req, res) {
  res.send('view article by id: ' + req.params.id)
});

// POST : add new comment to a particular article 
app.post('/articles/:id/comment', function(req, res) {
  // TODO
});

// DELETE : delete any comment (method override?)
app.delete('/articles/comment/:id', function(req, res) {
  // TODO
});



// Listen on port 8080
app.listen(8080, function() {
  console.log("App running on port 3000!");
});

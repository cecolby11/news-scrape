// =============
// DEPENDENCIES
// =============

var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var methodOverride = require('method-override');
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

// handlebars config
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(methodOverride("_method"));

// config db with mongoose
mongoose.connect("mongodb://localhost/news-scrape");
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

// GET: when user visits site, should scrape again
app.get('/', function(req, res) {
  res.redirect('/articles');
});

// GET: scrape articles and redirect to articles page for display 
// TODO: put this in the same route as displaying the articles so it's hit every time user views page
app.get('/scrape', function(req, res) {
   // 1. scrape news website 
  // a. grab html body with request
  request('http://www.techcrunch.com', function(error, response, html) {
    // b. load into cheerio 
    var $ = cheerio.load(html);
    // c. grab the articles 
    $('#river1 .river-block .block-content').each(function(i, element) {
      // empty result object
      var result = {};
      // add the headline and link of each article as properties of result 
      var info = $(this).children('h2');
      var a = info.children('a');
      var link = a.attr('href');
      result.headline = info.text();
      result.link = link;

      // create new Article
      var newArticle = new Article(result);

      // 2. TODO: check for duplicates
      
      // 3. save to db
      newArticle.save(function(err, doc) {
        if(err) {
          console.log(error);
        } else {
          console.log('article saved to db');
        }
      });
    });
  });
  res.redirect('/articles');
});

// GET : view all scraped articles from db
app.get('/articles', function(req, res) {
  // 1. get all articles from db and sort by date 
  Article.find({}, function(error, doc) {
    if(error) {
      console.log(error);
    } else {
      res.render('articles', {articles: doc});
    }
  });
});

// GET : view a single article by id and all of its associated comments
app.get('/articles/:id', function(req, res) {
  var articleId = req.params.id
  Article.findOne({'_id': articleId}).populate('comments').exec(function(error, doc) {
    if(error) {
      console.log(error);
    } else {
      res.render('article',doc);
    }
  });
});

// POST : add new comment to a particular article 
app.post('/articles/:id/comment', function(req, res) {
  var articleId = req.params.id;
  var newComment = new Comment(req.body);

  newComment.save(function(error, doc) {
    if(error) {
      console.log(error);
    } else {
      Article.findOneAndUpdate({'_id': articleId}, {$push: {'comments': doc._id}}, {new:true}, function(error, doc) {
        if(error) {
          console.log(error);
        } else {
          res.redirect('/articles/' + articleId);
        }
      });
    }
  })
});

// DELETE : delete any comment (method override?)
app.delete('/articles/:articleId/comment/:commentId', function(req, res) {
  var articleId = req.params.articleId;
  var commentId = req.params.commentId;

  // remove from comment array in Article
  Article.findOneAndUpdate({'_id': articleId}, {$pull: {'comments': commentId}}, function(error, doc) {
    if(error) {
      console.log(error);
    } else {
      // remove from Comments collection
      Comment.findByIdAndRemove(commentId, function(error, doc) {
        if(error) {
          console.log(error);
        } else {
          res.redirect('/articles/' + articleId);
        }
      });
    }
  });
});

// Listen on port 8080
app.listen(8080, function() {
  console.log("App running on port!");
});


// TODO cheerio check for duplicates in db before saving 
// TODO: hosting ****************
// other ideas: sharing on social media? pull in more article details, etc. 
// // function documentation
// page of author's comments? make author collections 
// TODO: validation (front end and database, e.g. length of author's name)
// TODO: style.css
// make comments window fixed height and scrollable, only display last X number of comments? 

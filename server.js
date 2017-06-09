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
  res.redirect('/articles/newest');
});

// GET: scrape articles and redirect to route for displaying newest
app.get('/scrape', function(req, res) {
  // 0. remove any previous unsaved articles from the db 
  Article.remove({'savedToDb':false}, function(error, doc) {
    if(error) {
      console.log(error);
    } else {
      //
    }
  });
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
      var datetime = info.siblings('.byline').children('time').attr('datetime');
      var author = info.siblings('.byline').children('a').text();

      result.headline = info.text();
      result.link = link;
      result.author = author;
      result.datetime = datetime;

      // save to db (will have 'unsaved' status)
      var newArticle = new Article(result);
      newArticle.save(function(err, doc) {
        if(err) {
          console.log(error);
        } else {
          console.log('new article saved to db');
        }
      });

    });
    // display 'unsaved' articles
    res.redirect('/articles/newest');
  });
});


// GET : view all unsaved/new articles from db
app.get('/articles/newest', function(req, res) {
  Article.find({'savedToDb': false}, function(error, doc) {
    if(error) {
      console.log(error);
    } else {
      res.render('index', {newArticles: doc});
    }
  });
});

// GET : view all saved articles from db
app.get('/articles', function(req, res) { 
  Article.find({'savedToDb': true}, function(error, doc) {
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

// PUT: update article from unsaved to saved
app.put('/articles/:id', function(req, res) {
  var articleId = req.params.id;

  Article.findOneAndUpdate({'_id': articleId}, {'savedToDb': true}, function(error, doc) {
    if(error) {
      console.log(error);
    } else {
      res.redirect('/articles/newest');
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

// DELETE: delete article by id 
app.delete('/articles/:id', function(req, res) {
  var articleId = req.params.id;

  Article.findByIdAndRemove(articleId, function(error, doc) {
    if(error) {
      console.log(error);
    } else {
      res.redirect('/articles');
    }
  })
})

// DELETE : delete any comment from article by id
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

// TODO: hosting ****************
// TODO: function documentation
// TODO: validation (e.g. length of author's name)
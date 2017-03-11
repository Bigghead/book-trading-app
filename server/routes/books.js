var express = require('express'),
    router  = express.Router(),
    Books   = require('../models/bookSchema.js'),
    User    = require('../models/userSchema.js');

router.get('/books', function(req, res){
  Books.find({}, function(err, foundBooks){
    if(err){
      console.log(err);
    } else {
      res.render('books', {books: foundBooks});
    }
  });
});

//=========SHOW ONE route ========
router.get('/books/:bookid', function(req, res){
  Books.findById(req.params.bookid, function(err, foundBook){
    if(err){
    console.log(err);
  } else {
    User.findById(req.user._id).populate('booksOwned').populate('userTrade').exec(function(err, foundUser){
      if(err){
        console.log(err);
      } else {
        res.render('singleBook', { book: foundBook , currentUser: foundUser});
      }
    });
  }
  });
});

module.exports = router;

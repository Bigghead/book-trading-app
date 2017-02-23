var express = require('express'),
    router  = express.Router(),
    User    = require('../models/userSchema.js'),
    Books   = require('../models/bookSchema.js'),
    bookSearch     = require('google-books-search'),
    keys    = require('../../keys');


var bookSearchOptions = {
   key: keys.googleBooksApi,
   field: 'title',
   offset: 0,
   limit: 3,
   type: 'books',
   order: 'relevance',
   lang: 'en'
 };

 //==============PROFILE PAGE ==============

 router.get('/user/:id/user-profile', function(req, res){
   User.findById(req.params.id, function(err, foundUser){
     if(err){
       res.send(err);
     } else {
       res.render('userProfile', { foundUser : foundUser });
     }
   });
 });

 router.get('/user/:id/user-profile/edit', function(req, res){
   User.findById(req.params.id, function(err, foundUser){
     if(err){
       res.send(err);
     } else {
       res.render('profileEdit', { foundUser : foundUser });
     }
   });
 });

router.get('/user/:id', function(req, res){
  var id = req.params.id;
  User.findById(id).populate('booksOwned').exec(function(err, foundUser){
    res.render('userBooks', {foundUser : foundUser});
  });
});



//=============ADD A BOOK =============
router.post('/user/:id', function(req, res){

  bookSearch.search(req.body.newBook, function(err, results){
    if(err){
      console.log(err);
    } else {
      Books.create({
        bookName: results[0].title,
        description: results[0].description,
        picture: results[0].thumbnail,
        ownedBy: req.params.id
      }, function(err, madeBook){
        if(err){
          console.log(err);
        } else {
          User.findById(req.params.id, function(err, foundUser){
            if(err){
              console.log(err);
            } else {
              foundUser.booksOwned.push(madeBook);
              foundUser.save();
              console.log(foundUser.booksOwned);
              //.then(function(){
                res.redirect('/user/' + req.params.id);
            //  });
            }
          });
        }
      });
    }
  });
});

//==========DELETE A BOOK=======
router.get('/user/:userid/:bookid', function(req, res){
      Books.findByIdAndRemove(req.params.bookid, function(err, success){
        if(err){
          console.log(err)
        } else {
          console.log('sucess');
          User.findById(req.params.userid, function(err, foundUser){
            if(err){
              console.log(err);
            } else {
              console.log('hello');
              foundUser.booksOwned.splice(foundUser.booksOwned.indexOf(req.params.bookid), 1);
              foundUser.save();
          res.redirect('/user/' + req.params.userid);
        }
      });
    }
  });
});



module.exports = router;

const express = require('express');
const Books   = require('../models/bookSchema.js');
const User    = require('../models/userSchema.js');
const RequestedTrade = require('../models/requestedTrade.js');
const UserTrade      = require('../models/userTrade.js');
const router  = express.Router();


function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    res.redirect('/books');
  }
}

//===============TRADE ROUTE======
router.post("/books/trade/:bookOwner/:theirBookid/:yourid", isLoggedIn, async (req, res) => {

  if(!req.body.book) return res.redirect('/books');

  try {

    const tradingBook   = await Books.findById(req.body.book);
    const requestedBook = await Books.findById(req.params.theirBookid);
    const tradingUser   = await User.findById(req.params.yourid);
    const requestedUser = await User.findById(req.params.bookOwner);

    const madeRequestedTrade = await RequestedTrade.create( {
        theirID    : tradingUser._id,
        theirBook  : tradingBook.bookName,
        theirBookID: tradingBook._id,
        userBook   : requestedBook.bookName,
        userBookID : requestedBook._id
    } );
    const madeUserTrade = await UserTrade.create( {
        userBook       : tradingBook.bookName,
        userBookID     : tradingBook._id,
        requestedBook  : requestedBook.bookName,
        requestedBookID: requestedBook._id,
        requestedUserID: requestedUser._id,
        accepted       : false
    } );

    tradingUser.userTrade.push(madeUserTrade);
    await tradingUser.save();
    requestedUser.peopleWantingToTrade.push(madeRequestedTrade);
    await requestedUser.save();

    res.redirect('/books');

  } catch ( e ) { console.log(e); }

});


router.get('/tradeRequest', isLoggedIn, function(req, res){
  User.findById(req.user._id).populate('peopleWantingToTrade').exec(function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      res.render('tradeRequest', { currentUser: foundUser});
    }
  });
});



// ==========IF THEY ACCEPT YOUR TRADE==================
router.get('/tradeRequest/:tradeid/:requestedBookId/:askerBookId', isLoggedIn, function(req, res){

  const done = false;
  RequestedTrade.findByIdAndRemove(req.params.tradeid, function(err, foundTrade){
    if(err){
      console.log(err);
    } else {

      UserTrade.findByIdAndRemove(foundTrade.otherUserTradeID, function(err, foundUserTrade){
        if(err){
          console.log(err);
        } else {


          User.findById(req.user._id, function(err, requestedUser){
            if(err){
              console.log(err);
            } else {

              //take out requesting user's book, push the other user's book in
              requestedUser.booksOwned.splice(requestedUser.booksOwned.indexOf(foundTrade.userBookID), 1);
              requestedUser.booksOwned.push(foundTrade.theirBookID);
              requestedUser.peopleWantingToTrade.splice(requestedUser.peopleWantingToTrade.indexOf(req.params.tradeid), 1);
              requestedUser.save()

              User.findById(foundTrade.theirID, function(err, foundUser){
                if(err){
                  console.log(err);
                } else {

                  //take out  user's book, push the requesting user's book in
                  foundUser.booksOwned.splice(foundUser.booksOwned.indexOf(foundTrade.theirBookID), 1);
                  foundUser.booksOwned.push(foundTrade.userBookID);
                  foundUser.userTrade.splice(foundUser.userTrade.indexOf(foundTrade.otherUserTradeID), 1);
                  foundUser.save();


                  //NEED to clear this foundUser's userTrade, get rid of this trade, and re-push his book id back into his booksOwned

                  return new Promise(function(resolve, reject){
                  resolve(foundUser);
                  })


                  //Change the corresponding books' owners because we're hitting
                  //a route that depends on the book's owner later. Want it to be
                  //different every time, otherwise we're asking one user for a book they already own
                  .then(function(){
                    Books.findByIdAndUpdate(req.params.requestedBookId,{
                      ownedBy : requestedUser._id
                    }).exec()
                      .then(function(){
                        Books.findByIdAndUpdate(req.params.askerBookId,{
                          ownedBy: foundUser._id
                        }).exec()
                        .then(function(){
                            res.redirect('/books');
                        });
                      });
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});


// ==========IF THEY DENY YOUR TRADE==================
router.get('/rejectTrade/:tradeid/:requestedBookId/:askerBookId', isLoggedIn, function(req, res){
  RequestedTrade.findByIdAndRemove(req.params.tradeid, function(err, foundTrade){
    if(err) console.log(err);
    UserTrade.findByIdAndRemove(foundTrade.otherUserTradeID, function(err, foundUserTrade){
      if(err) console.log(err);
      //Logged In User
      User.findById(req.user._id, function(err, requestedUser){
        if(err) console.log(err);
        requestedUser.peopleWantingToTrade.splice(requestedUser.peopleWantingToTrade.indexOf(req.params.tradeid), 1);
        requestedUser.save();

        //Other User that is requesting for your book
        User.findById(foundTrade.theirID, function(err, foundOtherUser){
          if(err) console.log(err);
          foundOtherUser.userTrade.splice(foundOtherUser.userTrade.indexOf(foundTrade.otherUserTradeID), 1);
          foundOtherUser.save()
            .then(function(){
              res.redirect('/tradeRequest');
            });
        })
      });
    })
  })
});


router.get('/user-trades', isLoggedIn, ((req, res) => {
  User.findById(req.user._id).populate('userTrade').exec((err, foundUser) => {
    if(err) console.log(err);
    res.render('userTrade', { pendingTrades: foundUser.userTrade});
  });
}));

router.get('/cancel-trades/:bookID', isLoggedIn, ((req, res) => {
  const bookID = req.params.bookID;
  User.findById(req.user._id).populate('userTrade')
    .exec()
    .then((user) => {
        const userTrade = user.userTrade;
        userTrade.forEach(trade => {
            if(trade.userBookID.toString() === bookID){
                const otherUserID = trade.requestedUserID;
                userTrade.splice(userTrade.indexOf(trade), 1);
                user.save()

                return User.findById(otherUserID).populate('peopleWantingToTrade').exec()
                        .then(otherUser => {
                          
                            const reqTrade = otherUser.peopleWantingToTrade;
                            reqTrade.forEach(requested => {
                                if(requested.theirBookID.toString() === bookID){
                                    reqTrade.splice(reqTrade.indexOf(requested), 1);
                                    otherUser.save()

                                    .then(() => {
                                        res.redirect('/books');
                                    })
                                }
                            })
                        });
            }
        }); 
    });

}));


module.exports = router;
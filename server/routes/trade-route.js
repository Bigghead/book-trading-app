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
router.get('/tradeRequest/:tradeid/:requestedBookId/:askerBookId', isLoggedIn, async(req, res) => {

    const { tradeid, requestedBookId, askerBookId } = req.params;
    try {

        const foundTrade     = await RequestedTrade.findByIdAndRemove(tradeid);
        const foundUserTrade = await UserTrade.findByIdAndRemove(foundTrade.otherUserTradeID);
        const requestedUser  = await User.findById(req.user._id);
        const foundUser      = await User.findById(foundTrade.theirID);

        //take out requesting user's book, push the other user's book in
        requestedUser.booksOwned.splice(requestedUser.booksOwned.indexOf(foundTrade.userBookID), 1);
        requestedUser.booksOwned.push(foundTrade.theirBookID);
        requestedUser.peopleWantingToTrade.splice(requestedUser.peopleWantingToTrade.indexOf(tradeid), 1);
        await requestedUser.save();

        //take out  user's book, push the requesting user's book in
        foundUser.booksOwned.splice(foundUser.booksOwned.indexOf(foundTrade.theirBookID), 1);
        foundUser.booksOwned.push(foundTrade.userBookID);
        foundUser.userTrade.splice(foundUser.userTrade.indexOf(foundTrade.otherUserTradeID), 1);
        foundUser.save();

        await Books.findByIdAndUpdate(requestedBookId,{
            ownedBy : requestedUser._id
        });
        await Books.findByIdAndUpdate(askerBookId,{
            ownedBy: foundUser._id
        });

        res.redirect('/books');

    } catch( e ) { throw new Error(e); }
  
});


// ==========IF THEY DENY YOUR TRADE==================
router.get('/rejectTrade/:tradeid/:requestedBookId/:askerBookId', isLoggedIn, async(req, res) => {

    const { tradeid, requestedBookId, askerBookId } = req.params;

    try {

        const foundTrade     = await RequestedTrade.findByIdAndRemove(tradeid);
        const foundUserTrade = await UserTrade.findByIdAndRemove(foundTrade.otherUserTradeID);
        const requestedUser  = await User.findById(req.user._id);
        const requestingUser = await User.findById(foundTrade.theirID);

        requestedUser.peopleWantingToTrade.splice(requestedUser.peopleWantingToTrade.indexOf(tradeid), 1);
        requestingUser.userTrade.splice(requestingUser.userTrade.indexOf(foundTrade.otherUserTradeID), 1);

        await requestedUser.save();
        await requestingUser.save();

        res.redirect('/tradeRequest');

    } catch(e) { throw new Error(e); }

});


router.get('/user-trades', isLoggedIn, ((req, res) => {
  User.findById(req.user._id).populate('userTrade').exec((err, foundUser) => {
    if(err) console.log(err);
    res.render('userTrade', { pendingTrades: foundUser.userTrade});
  });
}));


router.get('/cancel-trades/:bookID', isLoggedIn, async(req, res) => {
    const bookID = req.params.bookID;

    try {

        let otherUserID;
        const user = await User.findById(req.user._id);
        const { userTrade } = user;
        userTrade.forEach(trade => {
            if(trade.userBookID.toString() === bookID){
                otherUserID = trade.requestedUserID;
                userTrade.splice(userTrade.indexOf(trade), 1);
            }
        });

        const otherUser = await User.findById(otherUserID);
        const { peopleWantingToTrade: reqTrade } = otherUser;
        reqTrade.forEach(requested => {
            if(requested.theirBookID.toString() === bookID){
                reqTrade.splice(reqTrade.indexOf(requested), 1);
            }
        });

        await user.save();
        await otherUser.save();

        res.redirect('/books');

    } catch(e) { throw new Error(e); }

});


module.exports = router;
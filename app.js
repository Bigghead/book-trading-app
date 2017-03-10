var express        = require('express'),
    mongoose       = require('mongoose'),
    bodyParser     = require('body-parser'),
    passport       = require('passport'),
    Auth0Strategy  = require('passport-auth0'),
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn(),
    bookSearch     = require('google-books-search'),
    Session        = require('express-session'),
    keys           = require('./keys');
    app            = express();

//=====mongoose connect
mongoose.Promise = global.Promise;
mongoose.set('debug', true)
mongoose.connect(keys.mLab);

//======Model Requires=====
var Books          = require('./server/models/bookSchema.js'),
    User           = require('./server/models/userSchema.js'),
    UserTrade      = require('./server/models/userTrade.js'),
    RequestedTrade = require('./server/models/RequestedTrade.js');


//======ROUTES REQUIRES======
var bookRoute = require('./server/routes/books.js'),
    authRoute = require('./server/routes/authentication.js');
    userRoute = require('./server/routes/user.js');

app.set('view engine', 'ejs');
app.set('views',__dirname+'/client/views');
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(Session({
  secret: 'This is Sparta Again',
  resave :false,
  saveUninitialized: false
}));

// This can be used to keep a smaller payload
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});



app.use(passport.initialize());
app.use(passport.session());
// Configure Passport to use Auth0
var strategy = new Auth0Strategy({
    domain:       process.env.AUTH0_DOMAIN || keys.auth0Domain,
    clientID:     process.env.AUTH0_CLIENT_ID || keys.auth0Client,
    clientSecret: process.env.AUTH0_CLIENT_SECRET || keys.auth0Secret,
    callbackURL:  process.env.AUTH0_CALLBACK_URL || 'http://localhost:9000/auth/callback'
  }, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    User.findOne({username: profile.nickname}, function(err, foundUser){
      if(err){
        console.log(err);
      } else if(foundUser === null){
        User.create({
          username: profile.nickname
        }, function(err, madeUser){
          if(err){
            console.log(err);
          } else {
            return done(null, madeUser);
          }
        });
      } else {
        return done(null, foundUser);
      }
    });
  });

passport.use(strategy);


app.use(function(req, res, next){
  if(req.user){
    User.findById(req.user._id, function(err, foundUser){
     if(err){
      console.log(err);
     } else {
       res.locals.currentUser = foundUser;
       next();
     }
    })
  } else {
    res.locals.currentUser = undefined;
    next();
 }
});

app.use(bookRoute);
app.use(authRoute);
app.use(userRoute);


app.get('/', function(req, res){
  res.render('index.ejs');
});










//===============TRADE ROUTE======
app.post("/books/trade/:bookOwner/:theirBookid/:yourid", function(req, res){
  const done = false;

  Books.findById(req.body.book, function(err, tradingBook){
    if(err){
      console.log(err);
    } else {
      Books.findById(req.params.theirBookid, function(err, requestedBook){
        if(err){
          console.log(err);
        } else {


          User.findById(req.params.yourid, function(err, tradingUser){
            if(err){
              console.log(err);
            } else {
              User.findById(req.params.bookOwner, function(err, requestedUser){
                if(err){
                  console.log(err);
                } else {

                  //tradingUser.booksOwned.splice(tradingUser.booksOwned.indexOf(tradingBook._id), 1);

                      RequestedTrade.create({
                        theirID : tradingUser._id,
                        theirBook: tradingBook.bookName,
                        theirBookID: tradingBook._id,
                        userBook : requestedBook.bookName,
                        userBookID: requestedBook._id

                      }, function(err, madeRequestedTrade){
                        if(err){
                          console.log(err);
                        }  else {

                          UserTrade.create({
                            userBook: tradingBook.bookName,
                            userBookID: tradingBook._id,
                            requestedBook: requestedBook.bookName,
                            requestedBookID: requestedBook._id,
                            requestedUserID: requestedUser._id,
                            accepted: false

                          }, function(err, madeUserTrade){
                            if(err){
                              console.log(err);
                            } else {
                              tradingUser.userTrade.push(madeUserTrade);
                              tradingUser.save()
                              .then(function(){
                                  requestedUser.peopleWantingToTrade.push(madeRequestedTrade);
                                  console.log(tradingUser);
                                  requestedUser.save();
                                })
                              .then(function(){
                                    res.redirect('/books');
                                });
                              }
                            });  //end madeUserTrade
                            }
                          }); //end create
                        }
                    }); //end second user.find
                  }
              }); //end first user.find
            }
         }); //second books.find
       }
    }); //first books.find
});


app.get('/tradeRequest', function(req, res){
  User.findById(req.user._id).populate('peopleWantingToTrade').exec(function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      res.render('tradeRequest', { currentUser: foundUser});
    }
  });
});



//==========IF THEY ACCEPT YOUR TRADE==================
app.get('/tradeRequest/:tradeid/:requestedBookId/:askerBookId', function(req, res){

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
                  foundUser.userTrade.splice(foundUser.userTrade.indexOf(foundTrade.userBookID), 1);
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

// Perform the final stage of authentication and redirect to '/user'
app.get('/auth/callback',
  passport.authenticate('auth0', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/books');
  });




app.get('/user-trades', ((req, res) => {
  User.findById(req.user._id).populate('userTrade').exec((err, foundUser) => {
    if(err) console.log(err);
    console.log(foundUser);
    res.render('userTrade', { pendingTrades: foundUser.userTrade});
  });
}));

app.get('/cancel-trades/:tradeId', ((req, res) => {
  const tradeId = req.params.tradeId;
  User.findById(req.user._id, function(err, foundUser){
    if(err) console.log(err);
    foundUser.userTrade.splice(foundUser.userTrade.indexOf(tradeId), 1);
    foundUser.save().then((user) => res.send(user));
  });
}));


app.get('/testing', function(req, res){
  User.findById(req.user._id).populate('userTrade').exec(function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      console.log('Success: ' + foundUser);
      res.json(foundUser);
    }
  });
})

app.listen('9000', function(){
  console.log('Book Trading App Live!');
});

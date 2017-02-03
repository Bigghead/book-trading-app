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
mongoose.connect(keys.mLab);

//======Model Requires=====
var Books = require('./server/models/bookSchema.js'),
    User = require('./server/models/userSchema.js');

var bookSearchOptions = {
        key: keys.googleBooksApi,
        field: 'title',
        offset: 0,
        limit: 3,
        type: 'books',
        order: 'relevance',
        lang: 'en'
    };

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
  res.locals.currentUser = req.user;
  next();
});
app.get('/', function(req, res){
  res.render('index.ejs');
});

app.get('/books', function(req, res){
  Books.find({}, function(err, foundBooks){
    if(err){
      console.log(err);
    } else {
      res.render('books', {books: foundBooks});
    }
  });
});

//=========SHOW ONE route ========
app.get('/books/:bookid', function(req, res){
  Books.findById(req.params.bookid, function(err, foundBook){
    if(err){
    console.log(err);
  } else {
    User.findById(req.user._id).populate('booksOwned').exec(function(err, foundUser){
      if(err){
        console.log(err);
      } else {
        console.log(foundBook);
        res.render('singleBook', { book: foundBook , currentUser: foundUser});
      }
    });
  }
  });
});

app.get('/login',
  function(req, res){
  res.render('login', {env: keys});
  });

// Perform session logout and redirect to homepage
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.post('/books/user/:id', function(req, res){

  bookSearch.search(req.body.newBook, function(err, results){
    if(err){
      console.log(err);
    } else {
      console.log(results);
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
              res.redirect('/books/user/' + req.params.id);
            }
          });
        }
      });
    }
  });
});

app.get('/books/user/:userid/:bookid', function(req, res){
  User.findById(req.params.userid, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      foundUser.booksOwned.splice(foundUser.booksOwned.indexOf(req.params.id), 1);
      foundUser.save();
      Books.findByIdAndRemove(req.params.bookid, function(err, success){
        if(err){
          console.log(err)
        } else {
          res.redirect('/books/' + req.params.userid);
        }
      });
    }
  });
});

app.get('/books/user/:id', function(req, res){
  var id = req.params.id;
  User.findById(id).populate('booksOwned').exec(function(err, foundUser){
    res.render('userBooks', {foundUser : foundUser});
  });
});


//===============TRADE ROUTE======
app.post("/books/trade/:bookOwner/:bookid/:yourid", function(req, res){
  res.send('Trading');
});

// Perform the final stage of authentication and redirect to '/user'
app.get('/auth/callback',
  passport.authenticate('auth0', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.listen('9000', function(){
  console.log('Book Trading App Live!');
});

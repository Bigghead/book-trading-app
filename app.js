var express        = require('express'),
    mongoose       = require('mongoose'),
    bodyParser     = require('body-parser'),
    expressSanitizer = require('express-sanitizer'),
    helmet         = require('helmet'),
    passport       = require('passport'),
    Auth0Strategy  = require('passport-auth0'),
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn(),
    bookSearch     = require('google-books-search'),
    Session        = require('express-session'),
    MongoStore     = require('connect-mongo')(Session),
    // keys           = require('./keys');
    port           = process.env.PORT || 9000,
    app            = express();

//=====mongoose connect
mongoose.Promise = global.Promise;
//mongoose.set('debug', true)
mongoose.connect(process.env.mlab || keys.mLab);

//======Model Requires=====
var Books          = require('./server/models/bookSchema.js'),
    User           = require('./server/models/userSchema.js'),
    UserTrade      = require('./server/models/userTrade.js'),
    RequestedTrade = require('./server/models/requestedTrade.js');


//======ROUTES REQUIRES======
var bookRoute = require('./server/routes/books.js'),
    authRoute = require('./server/routes/authentication.js');
    userRoute = require('./server/routes/user.js');
    tradeRoute = require('./server/routes/trade-route');

app.set('view engine', 'ejs');
app.set('views',__dirname+'/client/views');
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(helmet());

app.use(Session({
  secret: 'This is Sparta Again',
  resave :false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
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
    domain:       process.env.auth0Domain || keys.auth0Domain,
    clientID:     process.env.auth0Client || keys.auth0Client,
    clientSecret: process.env.auth0Secret || keys.auth0Secret,
    callbackURL:  'https://lychee-pie-43109.herokuapp.com/auth/callback'
    // callbackURL: 'http://localhost:9000/auth/callback'
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
app.use(tradeRoute);


app.get('/', function(req, res){
  res.render('index.ejs');
});


app.listen(port, function(){
  console.log('Book Trading App Live!');
});

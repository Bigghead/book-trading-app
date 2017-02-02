var express    = require('express'),
    mongoose   = require('mongoose'),
    bodyParser = require('body-parser'),
    passport   = require('passport'),
    Auth0Strategy = require('passport-auth0'),
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn(),
    Session         = require('express-session'),
    keys       = require('./keys');
    app        = express();

//=====mongoose connect
mongoose.connect(keys.mLab);

//======Model Requires=====
var Book = require('./server/models/bookSchema.js'),
    User = require('./server/models/userSchema.js');

app.set('view engine', 'ejs');
app.set('views',__dirname+'/client/views');

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
    return done(null, profile);
  });

passport.use(strategy);


app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  next();
});
app.get('/', function(req, res){
  res.render('index.ejs');
});

app.get('/login',
  function(req, res){
    res.render('login', { env: keys });
  });

// Perform session logout and redirect to homepage
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
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

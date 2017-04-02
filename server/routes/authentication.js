var passport       = require('passport'),
    Auth0Strategy  = require('passport-auth0'),
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn(),
    //keys           = require('../..//keys'),
    express        = require('express'),
    router         = express.Router();


router.get('/login',
function(req, res){
  res.render('login', {env: keys});
});

// Perform session logout and redirect to homepage
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Perform the final stage of authentication and redirect to '/user'
router.get('/auth/callback',
  passport.authenticate('auth0', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/books');
  });

module.exports = router;

var passport       = require('passport'),
    Auth0Strategy  = require('passport-auth0'),
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn(),
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

module.exports = router;

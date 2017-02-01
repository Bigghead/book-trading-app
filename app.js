var express    = require('express'),
    mongoose   = require('mongoose'),
    bodyParser = require('body-parser'),
    passport   = require('passport'),
    keys       = require('./keys');
    app        = express();

//mongoose connect
mongoose.connect(keys.mLab);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/client/views'));



app.get('/', function(req, res){
  res.render('index');
});

app.listen('9000', function(){
  console.log('Book Trading App Live!');
});

var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  username: String,
  settings: {
    name: String,
    city: String,
    state: String
  },
  booksOwned: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref : 'Book'
    }
  ],
  peopleWantingToTrade:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref : 'Requestedtrade'
    }
  ],
  userTrade : [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref : 'Usertrade'
    }
  ]
});

var User = mongoose.model('User', userSchema);

module.exports = User;

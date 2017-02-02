var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  username: String,
  booksOwned: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref : 'Book'
    }
  ],
  userTrade:[
    {
      userBook: String,
      userBookID: mongoose.Schema.Types.ObjectId,
      theirBook: String,
      theirBookID: mongoose.Schema.Types.ObjectId,
      accepted: Boolean
    }
  ],
  peopleWantingToTrade:[
    {
      theirBook: String,
      theirBookID: mongoose.Schema.Types.ObjectId,
      userBook : String,
      userBookID: mongoose.Schema.Types.ObjectId
    }
  ]
});

var User = mongoose.model('User', userSchema);

module.exports = User;

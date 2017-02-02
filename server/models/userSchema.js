var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  username: String,
  booksOwned: [],
  userTrade:[
    {
      userBook: String,
      userBookID: Schema.Types.ObjectId,
      theirBook: String,
      theirBookID: Schema.Types.ObjectId,
      accepted: Boolean
    }
  ],
  peopleWantingToTrade:[
    {
      theirBook: String,
      theirBookID: Schema.Types.ObjectId,
      userBook : String,
      userBookID: Schema.Types.ObjectId
    }
  ]
});

var User = mongoose.model('User', userSchema);

module.exports = User;

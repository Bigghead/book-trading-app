var mongoose = require('mongoose');

var requested = new mongoose.Schema({
  theirID : mongoose.Schema.Types.ObjectId,
  theirBook: String,
  theirBookID: mongoose.Schema.Types.ObjectId,
  userBook : String,
  userBookID: mongoose.Schema.Types.ObjectId,
  otherUserTradeID : mongoose.Schema.Types.ObjectId
});

var RequestedTrade = mongoose.model('Requestedtrade', requested);

module.exports = RequestedTrade;

var mongoose = require('mongoose');

var userTradeSchema = new mongoose.Schema({
  userBook: String,
  userBookID: mongoose.Schema.Types.ObjectId,
  theirBook: String,
  theirBookID: mongoose.Schema.Types.ObjectId,
  accepted: Boolean
});

var UserTrade = mongoose.model('Usertrade', userTradeSchema);

module.exports = userTrade;

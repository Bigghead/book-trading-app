var mongoose = require('mongoose');

var userTradeSchema = new mongoose.Schema({
  userBook: String,
  userBookID: mongoose.Schema.Types.ObjectId,
  requestedBook: String,
  requestedBookID: mongoose.Schema.Types.ObjectId,
  accepted: Boolean
});

var UserTrade = mongoose.model('Usertrade', userTradeSchema);

module.exports = UserTrade;

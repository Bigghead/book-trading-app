var mongoose = require('mongoose');

var userTradeSchema = new mongoose.Schema({
  accepted: Boolean
});

var UserTrade = mongoose.model('Usertrade', userTradeSchema);

module.exports = UserTrade;

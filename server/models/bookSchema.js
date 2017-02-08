var mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({
  bookName: String,
  description: String,
  picture: String,
  ownedBy : mongoose.Schema.Types.ObjectId
});

var Book = mongoose.model('Book', bookSchema);

module.exports = Book;

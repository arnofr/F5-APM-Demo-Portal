var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var GroupSchema   = new Schema({
  name            : { type: String, unique: true },
  category            : ['string']
});

mongoose.model('Group', GroupSchema);

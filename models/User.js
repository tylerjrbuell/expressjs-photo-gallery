mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  google_id: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  display_name: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  user_photos: {
    type: Array,
  },
  friends_list: {
    type: Array,
  }
},{strict: false});

User = mongoose.model("Users", userSchema);

module.exports = User;
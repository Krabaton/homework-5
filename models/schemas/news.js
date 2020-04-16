const mongoose = require('mongoose')

const Schema = mongoose.Schema
const newsSchema = new Schema({
  created_at: {
    type: Date,
  },
  text: {
    type: String,
  },
  title: {
    type: String,
  },
  user: {
    id: String,
    firstName: String,
    middleName: String,
    surName: String,
    image: String,
    userName: String,
  },
})

const News = mongoose.model('new', newsSchema)

module.exports = News

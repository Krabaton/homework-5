const mongoose = require('mongoose')
const User = require('./schemas/user')

module.exports.getUserByName = async (userName) => {
  return User.findOne({ userName })
}
module.exports.getUserById = async (id) => {
  return User.findById({ _id: id })
}
module.exports.getUsers = async () => {
  return User.find()
}
module.exports.createUser = async (data) => {
  const { username, surName, firstName, middleName, password } = data
  const newUser = new User({
    userName: username,
    surName,
    firstName,
    middleName,
    image:
      'https://icons-for-free.com/iconfiles/png/512/profile+user+icon-1320166082804563970.png',
    permission: {
      chat: { C: true, R: true, U: true, D: true },
      news: { C: true, R: true, U: true, D: true },
      settings: { C: true, R: true, U: true, D: true },
    },
  })
  newUser.setPassword(password)
  const user = await newUser.save()
  console.log(user)
  return user
}
module.exports.updateUser = () => {}
module.exports.deleteUser = () => {}

module.exports.getNews = async () => {}
module.exports.createNews = () => {}
module.exports.updateNews = () => {}
module.exports.deleteNews = () => {}

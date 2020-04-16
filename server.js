const express = require('express')
const path = require('path')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require('socket.io').listen(server)
require('./models/connection')

// parse application/json
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(function (_, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  )
  next()
})
app.use(express.static(path.join(__dirname, 'build')))

require('./auth/passport')

app.use('/api', require('./routes'))

app.use('*', (_req, res) => {
  const file = path.resolve(__dirname, 'build', 'index.html')
  res.sendFile(file)
})

app.use((err, _, res, __) => {
  console.log(err.stack)
  res.status(500).json({
    code: 500,
    message: err.message,
  })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, function () {
  console.log('Environment', process.env.NODE_ENV)
  console.log(`Server running. Use our API on port: ${PORT}`)
})

const connectedUsers = {}

io.on('connection', (socket) => {
  const socketId = socket.id
  socket.on('users:connect', function (data) {
    // { userId: '5e9483d6d96b341ba80bc28e', username: 'krab' }
    const user = { ...data, socketId, activeRoom: null }
    connectedUsers[socketId] = user
    socket.emit('users:list', Object.values(connectedUsers))
    socket.broadcast.emit('users:add', user)
  })
  socket.on('message:add', function (data) {
    // {senderId: '5e9483d6d96b341ba80bc28e', recipientId: '5e9483d6d96b341ba80bc28e', text: 'Hi'}
    console.log('message:add')
    console.log(data)
    socket.emit('message:add', data)
    socket.broadcast.to(data.roomId).emit('message:add', data)
  })
  socket.on('message:history', function (data) {
    // {recipientId: '5e9483d6d96b341ba80bc28e', userId: '5e9483d6d96b341ba80bc28e'}
    console.log('message:history')
    console.log(data)
  })
  socket.on('disconnect', function (data) {
    delete connectedUsers[socketId]
    socket.broadcast.emit('users:leave', socketId)
  })
})

module.exports = { app: app, server: server }

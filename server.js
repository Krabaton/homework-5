const express = require('express')
const path = require('path')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require('socket.io').listen(server)
require('./models/connection')

// parse application/json
app.use(express.json())

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
  console.log(`Server running. Use our API on port: ${PORT}`)
})

io.on('connection', (socket) => {
  socket.on('users:connect', function (data) {
    console.log(data)
  })
  socket.on('message:add', function (data) {
    console.log(data)
  })
  socket.on('message:history', function (data) {
    console.log(data)
  })
  socket.on('disconnect', function (data) {
    console.log(data)
  })
})

module.exports = app

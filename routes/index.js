const express = require('express')
const router = express.Router()
const mock = require('./mock.json')
const tokens = require('../auth/tokens')
const secret = require('../auth/config.json')
const passport = require('passport')
const db = require('../models')
const helper = require('../helpers/serialize')

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (!user || err) {
      res.status(401).json({
        code: 401,
        message: 'Unauthorized',
      })
    } else {
      next()
    }
  })(req, res, next)
}

router.post('/registration', async (req, res) => {
  const { username } = req.body
  const user = await db.getUserByName(username)
  if (user) {
    return res.status(400).json({})
  }
  try {
    const newUser = await db.createUser(req.body)
    const token = await tokens.createTokens(newUser, secret.secret)
    res.json({
      ...helper.serializeUser(newUser),
      ...token,
    })
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: e.message })
  }
})

router.post('/login', async (req, res, next) => {
  passport.authenticate(
    'local',
    { session: false },
    async (err, user, info) => {
      if (err) {
        return next(err)
      }
      if (!user) {
        return res.status(400).json({})
      }
      if (user) {
        const token = await tokens.createTokens(user, secret.secret)
        console.log(token)
        res.json({
          ...helper.serializeUser(user),
          ...token,
        })
      }
    },
  )(req, res, next)
})

router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.headers['authorization']
  const data = await tokens.refreshTokens(refreshToken, db, secret.secret)
  res.json({ ...data })
})

router
  .get('/profile', auth, async (req, res) => {
    const token = req.headers['authorization']
    const user = await tokens.getUserByToken(token, db, secret.secret)
    res.json({
      ...helper.serializeUser(user),
    })
  })
  .patch('/profile', auth, (req, res) => {
    console.log(req.body)
    const body = {
      firstName: 'Yura',
      middleName: 'Kuchma',
      surName: 'Vladimirovich',
      oldPassword: '1223456',
      newPassword: '123456',
      avatar: 0x12ad,
    }
  })

router
  .get('/users', auth, async (req, res) => {
    const users = await db.getUsers()
    // TODO: refactor on serialization
    res.json(users.map((user) => helper.serializeUser(user)))
  })
  .patch('/users/:id/permission', auth, (req, res) => {
    console.log(req.body)
    const body = {
      permission: {
        chat: { C: true, R: true, U: true, D: true },
        news: { C: true, R: true, U: true, D: true },
        settings: { C: true, R: true, U: true, D: true },
      },
    }
  })
  .delete('/users/:id', auth, (req, res) => {})

router
  .get('/news', auth, (req, res) => {
    console.log('NEWS:')
    res.json(mock.news)
  })
  .post('/news', auth, (req, res) => {
    console.log(req.body)
    res.json(mock.news)
  })
  .patch('/news/:id', auth, (req, res) => {
    console.log(req.body)
    res.json(mock.news)
  })
  .delete('/news/:id', auth, (req, res) => {
    console.log(req.body)
    res.json(mock.news)
  })

module.exports = router

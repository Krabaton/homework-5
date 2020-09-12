const express = require('express')
const router = express.Router()
const tokens = require('../auth/tokens')
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
    return res.status(400).json({}) // TODO:
  }
  try {
    const newUser = await db.createUser(req.body)
    const token = await tokens.createTokens(newUser)
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
        return res.status(400).json({}) // TODO:
      }
      if (user) {
        const token = await tokens.createTokens(user)
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
  // TODO: compare token from DB
  const data = await tokens.refreshTokens(refreshToken)
  res.json({ ...data })
})

router
  .get('/profile', auth, async (req, res) => {
    const token = req.headers['authorization']
    const user = await tokens.getUserByToken(token)
    res.json({
      ...helper.serializeUser(user),
    })
  })
  .patch('/profile', auth, async (req, res) => {
    console.log(req.body)
    // TODO:
    const token = req.headers['authorization']
    const user = await tokens.getUserByToken(token)
    res.json({
      ...helper.serializeUser(user),
    })
  })

router
  .get('/users', auth, async (req, res) => {
    const users = await db.getUsers()
    res.json(users.map((user) => helper.serializeUser(user)))
  })
  .patch('/users/:id/permission', auth, async (req, res, next) => {
    try {
      const user = await db.updateUserPermission(req.params.id, req.body)
      res.json({
        ...helper.serializeUser(user),
      })
    } catch (e) {
      next(e)
    }
  })
  .delete('/users/:id', auth, async (req, res) => {
    await db.deleteUser(req.params.id)
    res.status(204).json({})
  })

router
  .get('/news', auth, async (req, res, next) => {
    try {
      const news = await db.getNews()
      return res.json(news)
    } catch (e) {
      next(e)
    }
  })
  .post('/news', auth, async (req, res, next) => {
    try {
      const token = req.headers['authorization']
      const user = await tokens.getUserByToken(token)
      await db.createNews(req.body, user)
      const news = await db.getNews()
      res.json(news)
    } catch (e) {
      next(e)
    }
  })
  .patch('/news/:id', auth, async (req, res, next) => {
    try {
      await db.updateNews(req.params.id, req.body)
      const news = await db.getNews()
      res.json(news)
    } catch (e) {
      next(e)
    }
  })
  .delete('/news/:id', auth, async (req, res, next) => {
    try {
      await db.deleteNews(req.params.id)
      const news = await db.getNews()
      res.json(news)
    } catch (e) {
      next(e)
    }
  })

module.exports = router

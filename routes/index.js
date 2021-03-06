const express = require('express')
const router = express.Router()
const tokens = require('../auth/tokens')
const passport = require('passport')
const db = require('../models')
const helper = require('../helpers/serialize')

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (!user || err) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized',
      })
    }
    // TODO: check IP user
    req.user = user
    next()
  })(req, res, next)
}

router.post('/registration', async (req, res) => {
  const { username } = req.body
  const user = await db.getUserByName(username)
  if (user) {
    return res.status(409).json({}) // TODO:
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
    const user = req.user
    res.json({
      ...helper.serializeUser(user),
    })
  })
  .patch('/profile', auth, async (req, res) => {
    console.log(`PATH: req.body: `)
    console.log(req.body)
    // TODO:
    const user = req.user
    res.json({
      ...helper.serializeUser(user),
    })
  })

router
  .get('/users', auth, async (req, res) => {
    const user = req.user
    if (!user.permission.settings.R) {
      return res.status(403).json({
        code: 403,
        message: 'Forbidden',
      })
    }
    const users = await db.getUsers()
    res.json(users.map((user) => helper.serializeUser(user)))
  })
  .patch('/users/:id/permission', auth, async (req, res, next) => {
    try {
      const user = req.user
      if (!user.permission.settings.U) {
        return res.status(403).json({
          code: 403,
          message: 'Forbidden',
        })
      }
      const updatedUser = await db.updateUserPermission(req.params.id, req.body)
      res.json({
        ...helper.serializeUser(updatedUser),
      })
    } catch (e) {
      next(e)
    }
  })
  .delete('/users/:id', auth, async (req, res) => {
    const user = req.user
    if (!user.permission.settings.D) {
      return res.status(403).json({
        code: 403,
        message: 'Forbidden',
      })
    }
    await db.deleteUser(req.params.id)
    res.status(204).json({})
  })

router
  .get('/news', auth, async (req, res, next) => {
    try {
      const user = req.user
      if (!user.permission.news.R) {
        return res.status(403).json({
          code: 403,
          message: 'Forbidden',
        })
      }
      const news = await db.getNews()
      return res.json(news)
    } catch (e) {
      next(e)
    }
  })
  .post('/news', auth, async (req, res, next) => {
    try {
      const user = req.user

      if (!user.permission.news.C) {
        return res.status(403).json({
          code: 403,
          message: 'Forbidden',
        })
      }

      await db.createNews(req.body, user)
      const news = await db.getNews()
      res.status(201).json(news)
    } catch (e) {
      next(e)
    }
  })
  .patch('/news/:id', auth, async (req, res, next) => {
    try {
      const user = req.user
      console.log('🚀 ~ file: index.js ~ line 130 ~ .patch ~ user', user)

      if (!user.permission.news.U) {
        return res.status(403).json({
          code: 403,
          message: 'Forbidden',
        })
      }

      await db.updateNews(req.params.id, req.body)
      const news = await db.getNews()
      res.json(news)
    } catch (e) {
      next(e)
    }
  })
  .delete('/news/:id', auth, async (req, res, next) => {
    try {
      const user = req.user
      if (!user.permission.news.D) {
        return res.status(403).json({
          code: 403,
          message: 'Forbidden',
        })
      }
      await db.deleteNews(req.params.id)
      const news = await db.getNews()
      res.json(news)
    } catch (e) {
      next(e)
    }
  })

module.exports = router

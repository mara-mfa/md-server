import express from 'express'
import config from 'config'
const router = express.Router()

router.get('/', (req, res, next) => {
  res.send(config.layout || [])
})

export default router

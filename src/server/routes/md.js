import express from 'express'
var pjson = require('../../../package.json')
const router = express.Router()

router.get('/', (req, res, next) => {
  res.send(pjson.version)
})

export default router

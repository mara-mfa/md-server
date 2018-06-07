import express from 'express'
import config from 'config'
import log from '../logger'
const router = express.Router();

router.get('/', (req, res, next) => {
  res.send(config.layout || []);
})

export default router



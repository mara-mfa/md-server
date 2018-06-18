import express from 'express'
import config from 'config'
import log from '../logger'
var pjson = require('../../../package.json');
console.log(pjson.version);
const router = express.Router();

router.get('/', (req, res, next) => {
  res.send(pjson.version)
})

export default router


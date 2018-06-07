import express from 'express';
import log from "../logger";
const router = express.Router()

router.get('/', function(req, res, next) {
  res.send(req.user);
})

export default router

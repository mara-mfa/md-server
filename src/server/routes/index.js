import express from 'express'
import portlet from './portlet'
import api from './api'
import ws from './ws'
import layout from './layout'
import user from './user'
import md from './md'
import grpc from './grpc'

const router = express.Router();
router.get('/', function(req, res, next) {
  res.send('mDesktop Root')
})

router.use('/portlet', portlet)
router.use('/layout', layout)
router.use('/api', api)
router.use('/ws', ws)
router.use('/user', user)
router.use('/md', md)
router.use('/grpc', grpc)
export default router

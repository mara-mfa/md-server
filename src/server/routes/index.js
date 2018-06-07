import express from 'express'
import portlet from './portlet'
import api from './api'
import ws from './ws'
import layout from './layout'
import user from './user'

const router = express.Router();
router.get('/', function(req, res, next) {
  res.send('mDesktop Root')
})

router.use('/portlet', portlet)
router.use('/layout', layout)
router.use('/api', api)
router.use('/ws', ws)
router.use('/user', user)
export default router

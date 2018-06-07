import config from 'config'
import express from 'express'
import cookieSession from 'cookie-session'
import bodyParser from 'body-parser'
import passport from 'passport'
import http from 'http'
import MdMessageHub from 'md-lib/server/MdMessageHub'
import MDesktop from './MDesktop'
import mdRoute from './routes/index';
import authRoute from './auth'
import log from './logger'

const MSGHUB_SERVER = process.env.MSGHUB_SERVER || undefined
const MSGHUB_ID = process.env.MSGHUB_ID || 'mdesktop'
const MSGHUB_CLIENT = process.env.MSGHUB_CLIENT || 'mdesktop'
const DISABLE_AUTH = process.env.DISABLE_AUTH || 0
const SESSION_SECRET = process.env.SESSION_SECRET || 'jcIp866jEH'

var cookieSes = cookieSession({
  name: 'mdesktop', keys: ['SESSION_SECRET'], maxAge: 24 * 60 * 60 * 1000
})

global.mdHub = new MdMessageHub(MSGHUB_ID, MSGHUB_CLIENT)
global.mdHub.connect(MSGHUB_SERVER).then(() => {
  log.info('Successfully connected to messaging server ' + MSGHUB_SERVER)
}, (err) => {
  log.error('Error when connecting to messaging server ' + MSGHUB_SERVER, err)
  process.exit(1)
})

let mDesktop = new MDesktop()
let app = express()
let httpServer = http.Server(app)

app.use(cookieSes)
app.use(bodyParser.urlencoded({extended: false}))
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoute)


app.use('*', (req, res, next) => {
  if (!req.user && !DISABLE_AUTH) {
    res.redirect('/auth/google')
    return
  }
  if (DISABLE_AUTH) {
    req.user = {id: 0, displayName: 'mockUser', email: 'mock@email.com'}
  }
  next()
})


app.use('/md', mdRoute)
mDesktop.registerProxies(app)
mDesktop.registerSocket(httpServer)
mDesktop.registerNats();
app.use(express.static('dist-client'))

let port = process.env.PORT || config.PORT
httpServer.listen(port, function (err) {
  if (err) {
    log.error('Error when starting the server: ' + err)
  }
  log.info('mDesktop Server running on port ' + port)
});

// Cleanup
process.on('exit', mDesktop.cleanup);
process.on('SIGINT', mDesktop.cleanup);
process.on('SIGUSR1', mDesktop.cleanup);
process.on('SIGUSR2', mDesktop.cleanup);
process.on('uncaughtException', mDesktop.cleanup);

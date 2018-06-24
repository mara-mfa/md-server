import passport from 'passport/lib/index'
import Module from '../Module'
import AuthRouter from './routes/AuthRouter'
import log from '../logger'

export default class Auth extends Module {
  initialize () {
    let config = this.config
    config.DISABLE_AUTH ? log.warn('... bypassing AUTH as it is disabled') : log.info('... registering AUTH configuration and routes')
    config.DISABLE_AUTH ? this.disableAuth() : this.enableAuth()
  }

  enableAuth () {
    let app = this.modules.webServer.app
    let config = this.config
    app.use(passport.initialize())
    app.use(passport.session())
    app.use('/auth', new AuthRouter(this.modules.storage, config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.AUTH_CALLBACK_URL).router)
    app.use('*', (req, res, next) => {
      if (!req.user) {
        res.redirect('/auth/google')
        return
      }
      next()
    })
  }

  disableAuth () {
    let app = this.modules.webServer.app
    // Add mock user to every request to simulate AUTH
    app.use('*', (req, res, next) => {
      req.user = {id: 0, displayName: 'mockUser', email: 'mock@email.com'}
      next()
    })
  }

  validate () {
    let config = this.config
    let errMessages = []
    if (!config.DISABLE_AUTH) {
      if (!config.GOOGLE_CLIENT_ID) errMessages.push('Missing GOOGLE_CLIENT_ID. Provide it or disable auth by DISABLE_AUTH')
      if (!config.GOOGLE_CLIENT_SECRET) errMessages.push('Missing GOOGLE_CLIENT_SECRET. Provide it or disable auth by DISABLE_AUTH')
    }
    return errMessages
  }
}

import authRoute from "../auth"
import passport from "passport/lib/index"
import Module from "../Module"

export default class Auth extends Module {

  initialize() {
    let app = this.modules.webServer.app
    let config = this.config

    app.use(passport.initialize())
    app.use(passport.session())
    app.use('/auth', authRoute.getRoutes(config.DISABLE_AUTH, config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.AUTH_CALLBACK_URL))
    app.use('*', (req, res, next) => {
      if (!req.user && !config.DISABLE_AUTH) {
        res.redirect('/auth/google')
        return
      }
      if (config.DISABLE_AUTH) {
        req.user = {id: 0, displayName: 'mockUser', email: 'mock@email.com'}
      }
      next()
    })
  }

  validate() {
    let config = this.config
    let errMessages = []
    if (!config.DISABLE_AUTH) {
      if (!config.GOOGLE_CLIENT_ID) errMessages.push('Missing GOOGLE_CLIENT_ID. Provide it or disable auth by DISABLE_AUTH')
      if (!config.GOOGLE_CLIENT_SECRET) errMessages.push('Missing GOOGLE_CLIENT_SECRET. Provide it or disable auth by DISABLE_AUTH')
    }
    return errMessages
  }

}

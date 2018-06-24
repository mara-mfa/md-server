import express from 'express'
import log from '../../logger'
import passgoogle from 'passport-google-oauth20/lib/index'
import passport from 'passport/lib/index'

export default class AuthRouter {
  get router () {
    return this._router
  }

  constructor (storageModule, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_CALLBACK_URL) {
    this.storageModule = storageModule
    this.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID
    this.GOOGLE_CLIENT_SECRET = GOOGLE_CLIENT_SECRET
    this.AUTH_CALLBACK_URL = AUTH_CALLBACK_URL

    const GoogleStrategy = passgoogle.Strategy

    passport.serializeUser(function (user, done) {
      done(null, user)
    })
    passport.deserializeUser(function (user, done) {
      done(null, user)
    })

    passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID.replace(/\r?\n|\r/, ''),
      clientSecret: GOOGLE_CLIENT_SECRET.replace(/\r?\n|\r/, ''),
      callbackURL: AUTH_CALLBACK_URL // "http://localhost:8080/auth/google"
    },
    async (accessToken, refreshToken, profile, cb) => {
      if (this.storageModule) {
        let user = await this.storageModule.storeUser(profile, accessToken)
        cb(null, user)
      } else {
        log.warn('Storage module not available, user details not stored')
        cb(null, profile)
      }
    }
    ))
    this._router = express.Router()
    // Authenticate via google
    this._router.get('/google', passport.authenticate('google', {
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'],
      failureRedirect: '/login',
      session: true
    }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/')
    })

    this._router.get('/logout', function (req, res) {
      req.logout()
      res.redirect('/')
    })
  }
}

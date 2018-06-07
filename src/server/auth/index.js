import express from 'express'
import config from 'config'
import passport from 'passport'
import passgoogle from 'passport-google-oauth20'
import log from '../logger'

const DISABLE_AUTH = process.env.DISABLE_AUTH || 0
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const AUTH_CALLBACK_URL = process.env.AUTH_CALLBACK_URL || config.AUTH_CALLBACK_URL || ''

const router = express.Router();
const GoogleStrategy = passgoogle.Strategy

passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (user, done) {
  done(null, user)
})

if ((!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !AUTH_CALLBACK_URL) && !DISABLE_AUTH ) {
  log.error('Missing environment variables related to google authentication')
  log.error('Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and AUTH_CALLBACK_URL')
  log.error('or disable authentication by setting DISABLE_AUTH = 1')
  process.exit(1)
}
if (!DISABLE_AUTH) {
  passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID.replace(/\r?\n|\r/, ''),
      clientSecret: GOOGLE_CLIENT_SECRET.replace(/\r?\n|\r/, ''),
      callbackURL: AUTH_CALLBACK_URL // "http://localhost:8080/auth/google"
    },
    function (accessToken, refreshToken, profile, cb) {
      cb(null, {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value
      })
      // User.findOrCreate({googleId: profile.id}, function (err, user) {
      //   return cb(err, user);
      // });
    }
  ))

  // Authenticate via google
  router.get('/google', passport.authenticate('google', {
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'],
      failureRedirect: '/login',
      session: true
    }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    })

  router.get('/logout', function (req, res) {
    req.logout()
    res.redirect('/')
  })
}


export default router



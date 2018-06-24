import Module from '../Module'
import mongoose from 'mongoose'

import log from '../logger'
import User from './schema/User'

export default class Storage extends Module {
  initialize () {
    mongoose.connect(this.config.MONGODB_URL).then(function () {
      let db = mongoose.connection
      log.info(`Storage ${db.host}:${db.port} successfully connected `)
    }).catch((err) => {
      log.error('Error when connecting to DB')
      log.debug(err)
      throw (err)
    })
  }
  validate () {
    let config = this.config
    let errMessages = []
    if (!config.DISABLE_STORAGE) {
      if (!config.MONGODB_URL) errMessages.push('MONGODB_URL is not defined. Either provide it or disable storage by DISABLE_STOREGE')
    }
    return errMessages
  }
  start () {

  }

  async storeUser (profile, accessToken) {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await User.findOrCreate({
          provider: 'google',
          providerUserId: profile.id,
          accessToken: accessToken,
          displayName: profile.displayName,
          email: profile.emails[0].value
        })
        resolve(user)
      } catch (err) {
        log.error('Error when storing user', err)
        reject(err)
      }
    })
  }
}

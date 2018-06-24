import mongoose from 'mongoose'
import log from '../../logger'
const Schema = mongoose.Schema

const schema = new Schema({
  provider: String,
  providerUserId: String,
  accessToken: String,
  dateAdded: {type: Date, default: Date.now},
  displayName: String,
  email: String
})

schema.statics.findOrCreate = function (profile) {
  return new Promise((resolve, reject) => {
    this.findOne({ providerUserId: profile.providerUserId }, (err, result) => {
      if (err) {
        log.error('Error when finding user', err)
        reject(err)
      }
      if (!result) {
        log.info('User not found ...')
        let user = new User(profile)
        user.save((err, user) => {
          if (err) {
            reject(err)
          }
        })
      } else {
        log.debug('User has been found')
        resolve(result)
      }
    })
  })
}

const User = mongoose.model('User', schema)
export default User

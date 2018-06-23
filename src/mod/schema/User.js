import mongoose from 'mongoose'
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId
import log from '../../logger'

const schema = new Schema({
  provider:  String,
  providerUserId:  String,
  accessToken: String,
  dateAdded: {type: Date, default: Date.now},
  displayName: String,
  email: String
})

schema.statics.findOrCreate = function(profile, cb) {
  this.findOne({ providerUserId: profile.providerUserId }, (err, result) => {
    if (err) {
      log.error('Error when finding user', err)
      cb(err)
    }
    if (!result) {
      log.info('User not found ...')
      let user = new User(profile)
      user.save((err, user) => {
        cb(null, user)
      })
    } else {
      log.debug('User has been found')
      cb(null, result)
    }
  });
}

const User = mongoose.model('User', schema);
export default User

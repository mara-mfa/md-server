import Module from "../Module"
import log from "../logger"

export default class Storage extends Module {
  initialize() {

  }
  validate() {
    let config = this.config
    let errMessages = []
    if (!config.DISABLE_STORAGE) {
      if (!config.MONGODB_URL) errMessages.push('MONGODB_URL is not defined. Either provide it or disable storage by DISABLE_STOREGE')
    }
    return errMessages
  }

  start() {

  }
}

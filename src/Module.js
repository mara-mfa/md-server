import log from './logger'

export default class Module {
  constructor(id, modules, config) {
    this.id = id
    this.modules = modules
    this.config = config
    log.info(`Registering module ${id}`)
  }

  validate() {
    return []
  }

  initialize() {

  }

  start() {

  }
}

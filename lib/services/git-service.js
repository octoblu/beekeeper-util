const bindAll = require("lodash/fp/bindAll")

class GitService {
  constructor() {
    bindAll(Object.getOwnPropertyNames(GitService.prototype), this)
  }

  async release() {}
}

module.exports = GitService

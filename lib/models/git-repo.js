const bindAll = require("lodash/fp/bindAll")

class GitRepo {
  constructor() {
    bindAll(Object.getOwnPropertyNames(GitRepo.prototype), this)
  }
}

module.exports = GitRepo

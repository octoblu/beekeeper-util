const bindAll = require("lodash/fp/bindAll")
const TravisRepo = require("../models/travis-repo")

class TravisService {
  constructor({ githubToken, travisToken, travisEnabled, travisEnv, spinner }) {
    bindAll(Object.getOwnPropertyNames(TravisService.prototype), this)
    this.githubToken = githubToken
    this.travisToken = travisToken
    this.travisEnabled = travisEnabled
    if (this.travisEnabled && !this.githubToken) throw new Error("Missing githubToken in config")
    this.travisEnv = travisEnv
    this.spinner = spinner
  }

  async configure({ projectName, projectOwner, isPrivate }) {
    if (!this.travisEnabled) return
    const { githubToken, spinner, travisToken } = this
    const travisRepo = new TravisRepo({ projectName, projectOwner, isPrivate, githubToken, travisToken })
    if (spinner) spinner.start("Travis: Enabling repository")
    await travisRepo.init()
    await travisRepo.enable()
    if (spinner) spinner.log("Travis: Repository enabled")
    if (spinner) spinner.start("Travis: Updating environment variables")
    await travisRepo.updateAllEnv(this.travisEnv)
    if (spinner) spinner.log("Travis: Environment variables updated")
  }
}

module.exports = TravisService

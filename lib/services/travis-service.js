const bindAll = require("lodash/fp/bindAll")
const TravisRepo = require("../models/travis-repo")

class TravisService {
  constructor({ github, travis, spinner }) {
    bindAll(Object.getOwnPropertyNames(TravisService.prototype), this)
    this.githubToken = github.token
    this.travisToken = travis.token
    this.travisEnabled = travis.enabled
    if (this.travisEnabled && !this.githubToken) throw new Error("Missing github.token in config")
    this.travisEnv = travis.env
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
    if (spinner) spinner.start("Travis: Environment variables updated")
  }
}

module.exports = TravisService

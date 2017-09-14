const bindAll = require("lodash/fp/bindAll")
const TravisRepo = require("../models/travis-repo")
const fs = require("fs-extra")
const path = require("path")

class TravisService {
  constructor({ githubToken, travisToken, travisEnabled, travisJsonFile, spinner }) {
    bindAll(Object.getOwnPropertyNames(TravisService.prototype), this)
    this.githubToken = githubToken
    this.travisToken = travisToken
    this.travisEnabled = travisEnabled
    this.travisJsonFile = travisJsonFile
    if (this.travisEnabled && !this.githubToken) throw new Error("Missing githubToken in config")
    this.travisEnv = this.parseBeekeeperTravisJson().env
    this.spinner = spinner
  }

  parseBeekeeperTravisJson() {
    const filePath = this.travisJsonFile
    try {
      fs.accessSync(filePath, fs.constants.F_OK | fs.constants.R_OK)
    } catch (e) {
      return {}
    }
    return fs.readJsonSync(filePath)
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

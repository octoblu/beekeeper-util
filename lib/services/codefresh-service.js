const bindAll = require("lodash/fp/bindAll")
const CodefreshRepo = require("../models/codefresh-repo")

class CodefreshService {
  constructor({ npmToken, codefreshToken, codefreshEnabled, projectRoot, projectHasDockerfile, spinner, beekeeperUri }) {
    bindAll(Object.getOwnPropertyNames(CodefreshService.prototype), this)
    this.codefreshToken = codefreshToken
    this.codefreshEnabled = codefreshEnabled
    this.npmToken = npmToken
    this.projectRoot = projectRoot
    this.projectHasDockerfile = projectHasDockerfile
    this.beekeeperUri = beekeeperUri
    if (this.codefreshEnabled && !this.codefreshToken) throw new Error("Missing codefreshToken in config")
    if (this.codefreshEnabled && !this.npmToken) throw new Error("Missing npmToken in config")
    if (this.codefreshEnabled && !this.projectRoot) throw new Error("Missing projectRoot in config")
    this.spinner = spinner
  }

  async configure({ projectName, projectOwner, isPrivate }) {
    if (!this.codefreshEnabled) return
    if (!this.projectHasDockerfile) return
    const { spinner, codefreshToken, npmToken, projectRoot, beekeeperUri } = this
    const codefreshRepo = new CodefreshRepo({ projectName, projectOwner, isPrivate, codefreshToken, npmToken, projectRoot, beekeeperUri })
    if (spinner) spinner.start("Codefresh: Enabling repository")
    await codefreshRepo.init()
    await codefreshRepo.enable()
    if (spinner) spinner.log("Codefresh: Repository enabled")
  }
}

module.exports = CodefreshService

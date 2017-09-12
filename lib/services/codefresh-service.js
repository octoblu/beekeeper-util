const bindAll = require("lodash/fp/bindAll")
const CodefreshRepo = require("../models/codefresh-repo")
const get = require("lodash/get")

class CodefreshService {
  constructor({ codefresh, project, npm, spinner, beekeeper }) {
    bindAll(Object.getOwnPropertyNames(CodefreshService.prototype), this)
    this.codefreshToken = get(codefresh, "token")
    this.codefreshEnabled = get(codefresh, "enabled")
    this.npmToken = get(npm, "token")
    this.projectRoot = get(project, "root")
    this.projectHasDockerfile = get(project, "hasDockerfile")
    this.beekeeperUri = get(beekeeper, "uri")
    if (this.codefreshEnabled && !this.codefreshToken) throw new Error("Missing codefresh.token in config")
    if (this.codefreshEnabled && !this.npmToken) throw new Error("Missing npm.token in config")
    if (this.codefreshEnabled && !this.projectRoot) throw new Error("Missing project.root in config")
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

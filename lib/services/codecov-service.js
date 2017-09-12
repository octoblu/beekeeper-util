const bindAll = require("lodash/fp/bindAll")
const CodecovRepo = require("../models/codecov-repo")
const TravisRepo = require("../models/travis-repo")

class CodecovService {
  constructor({ codecov, travis, github, spinner }) {
    bindAll(Object.getOwnPropertyNames(CodecovService.prototype), this)
    this.codecovToken = codecov.token
    this.codecovEnabled = codecov.enabled
    this.travisToken = travis.token
    this.githubToken = github.token
    if (this.codecovEnabled && !this.codecovToken) throw new Error("Missing codecov.token in config")
    if (this.codecovEnabled && !this.githubToken) throw new Error("Missing github.token in config")
    this.codecovEnv = codecov.env
    this.spinner = spinner
  }

  async configure({ projectName, projectOwner, isPrivate }) {
    if (!this.codecovEnabled) return
    if (!isPrivate) return
    const { codecovToken, spinner, githubToken, travisToken } = this
    const codecovRepo = new CodecovRepo({ projectName, projectOwner, isPrivate, codecovToken })
    const travisRepo = new TravisRepo({ projectName, projectOwner, isPrivate, githubToken, travisToken })
    if (spinner) spinner.start("Codecov: Enabling repository")
    await codecovRepo.init()
    await codecovRepo.enable()
    const { upload_token } = await codecovRepo.get()
    await travisRepo.init()
    await travisRepo.enable()
    await travisRepo.upsertEnv({ name: "CODECOV_TOKEN", value: upload_token })
    if (spinner) spinner.log("Codecov: Repository enabled")
  }
}
module.exports = CodecovService

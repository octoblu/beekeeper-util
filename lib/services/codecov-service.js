const bindAll = require("lodash/fp/bindAll")
const CodecovRepo = require("../models/codecov-repo")
const TravisRepo = require("../models/travis-repo")

class CodecovService {
  constructor({ codecovToken, codecovEnabled, travisOrgToken, travisComToken, githubToken, spinner }) {
    bindAll(Object.getOwnPropertyNames(CodecovService.prototype), this)
    this.codecovToken = codecovToken
    this.codecovEnabled = codecovEnabled
    this.travisOrgToken = travisOrgToken
    this.travisComToken = travisComToken
    this.githubToken = githubToken
    if (this.codecovEnabled && !this.codecovToken) throw new Error("Missing codecov.token in config")
    if (this.codecovEnabled && !this.githubToken) throw new Error("Missing github.token in config")
    this.spinner = spinner
  }

  async configure({ projectName, projectOwner, isPrivate }) {
    const { codecovEnabled, codecovToken, spinner, githubToken, travisOrgToken, travisComToken } = this
    if (!codecovEnabled) return
    if (!isPrivate) {
      if (spinner) spinner.log("Codecov: Skipped public repo")
      return
    }
    const codecovRepo = new CodecovRepo({ projectName, projectOwner, isPrivate, codecovToken })
    const travisRepo = new TravisRepo({
      projectName,
      projectOwner,
      isPrivate,
      githubToken,
      travisOrgToken,
      travisComToken,
    })
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

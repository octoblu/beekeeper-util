const request = require("request-promise-native")
const bindAll = require("lodash/fp/bindAll")

class BeekeeperDeployment {
  constructor({ projectName, projectOwner, isPrivate, beekeeperUri }) {
    bindAll(Object.getOwnPropertyNames(BeekeeperDeployment.prototype), this)
    this.projectName = projectName
    this.projectOwner = projectOwner
    if (!projectName) throw new Error("BeekeeperDeployment requires projectName")
    if (!projectOwner) throw new Error("BeekeeperDeployment requires projectOwner")
    this.isPrivate = isPrivate
    this.beekeeperUri = beekeeperUri
    const baseUrl = beekeeperUri

    this.request = request.defaults({
      baseUrl,
      headers: {
        "User-Agent": "Beekeeper Util/1.0",
        Accept: "application/json",
      },
    })
  }

  async init() {
    this.authedRequest = this.request.defaults()
    return Promise.resolve()
  }

  create({ projectVersion }) {
    const parsedTag = this._parseTag(projectVersion)
    return this.authedRequest.post(`/deployments/${this.projectOwner}/${this.projectName}/${parsedTag}`)
  }

  delete({ projectVersion }) {
    const parsedTag = this._parseTag(projectVersion)
    return this.authedRequest.delete(`/deployments/${this.projectOwner}/${this.projectName}/${parsedTag}`)
  }

  tag({ projectVersion, tagName }) {
    const parsedTag = this._parseTag(projectVersion)
    const json = { tagName }
    return this.authedRequest.post(`/deployments/${this.projectOwner}/${this.projectName}/${parsedTag}/tags`, { json })
  }

  _parseTag(tag) {
    if (tag == "latest") return tag
    return `v${tag}`
  }
}

module.exports = BeekeeperDeployment

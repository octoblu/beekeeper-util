const request = require("request-promise-native")
const { StatusCodeError } = require("request-promise-native/errors")
const bindAll = require("lodash/fp/bindAll")
const set = require("lodash/set")
const size = require("lodash/size")
const join = require("lodash/join")
const { getTag } = require("../helpers/semver-helper")

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
      json: true,
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

  async get({ tag, filterTags = [] }) {
    if (!tag) throw new Error("BeekeeperDeployment->get requires tag")
    const parsedTag = this._parseTag(tag)
    const options = {}
    if (size(filterTags)) set(options, "qs.tags", join(filterTags, ","))
    try {
      return await this.authedRequest.get(`/deployments/${this.projectOwner}/${this.projectName}/${parsedTag}`, options)
    } catch (error) {
      if (error instanceof StatusCodeError) {
        if (error.response.statusCode === 404) return
      }
      throw error
    }
  }

  delete({ projectVersion }) {
    const parsedTag = this._parseTag(projectVersion)
    return this.authedRequest.delete(`/deployments/${this.projectOwner}/${this.projectName}/${parsedTag}`)
  }

  update({ projectVersion, dockerUrl }) {
    const parsedTag = this._parseTag(projectVersion)
    const json = {
      docker_url: dockerUrl,
    }
    return this.authedRequest.patch(`/deployments/${this.projectOwner}/${this.projectName}/${parsedTag}`, { json })
  }

  webhook({ projectVersion, webhookType, ciPassing }) {
    const parsedTag = this._parseTag(projectVersion)
    const json = {
      tag: parsedTag,
      ci_passing: ciPassing,
    }
    return this.authedRequest.post(`/webhooks/${webhookType}/${this.projectOwner}/${this.projectName}`, { json })
  }

  tag({ projectVersion, tagName }) {
    const parsedTag = this._parseTag(projectVersion)
    const json = { tagName }
    return this.authedRequest.post(`/deployments/${this.projectOwner}/${this.projectName}/${parsedTag}/tags`, { json })
  }

  _parseTag(tag) {
    if (tag == "latest") return tag
    return getTag(tag)
  }
}

module.exports = BeekeeperDeployment

const request = require("request-promise-native")
const bindAll = require("lodash/fp/bindAll")
const startsWith = require("lodash/startsWith")
const url = require("url")
const { getVersion } = require("../helpers/semver-helper")

class Project {
  constructor({ projectUri }) {
    bindAll(Object.getOwnPropertyNames(Project.prototype), this)
    this.projectUri = projectUri
    this.request = request.defaults({
      baseUrl: this._getBaseUrl(projectUri),
      headers: {
        "User-Agent": "Beekeeper Util/1.0",
        Accept: "application/json",
      },
      json: true,
    })
  }

  async getVersion() {
    if (!this.projectUri) return
    try {
      const { version } = await this.request.get(`/version`)
      return getVersion(version)
    } catch (error) {
      return
    }
  }

  _getBaseUrl(projectUri) {
    if (!projectUri) return
    if (!startsWith(projectUri, "http")) {
      projectUri = `https://${projectUri}`
    }
    const parts = url.parse(projectUri)
    parts.pathname = "/"
    parts.slashes = true
    parts.protocol = "https"
    return url.format(parts)
  }
}

module.exports = Project

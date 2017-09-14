const request = require("request-promise-native")
const bindAll = require("lodash/fp/bindAll")
const { getVersion } = require("../helpers/semver-helper")

class Project {
  constructor({ projectUri }) {
    bindAll(Object.getOwnPropertyNames(Project.prototype), this)
    this.projectUri = projectUri
    this.request = request.defaults({
      baseUrl: projectUri,
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
}

module.exports = Project

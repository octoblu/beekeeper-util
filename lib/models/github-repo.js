const request = require("request-promise-native")
const bindAll = require("lodash/fp/bindAll")

class GithubRepo {
  constructor({ projectName, projectOwner, githubToken }) {
    bindAll(Object.getOwnPropertyNames(GithubRepo.prototype), this)
    this.projectName = projectName
    this.projectOwner = projectOwner
    if (!projectName) throw new Error("GithubRepo requires projectName")
    if (!projectOwner) throw new Error("GithubRepo requires projectOwner")
    this.authed = request.defaults({
      baseUrl: "https://api.github.com",
      headers: {
        "User-Agent": "Beekeeper Util/1.0",
        Authorization: `token ${githubToken}`,
      },
      json: true,
    })
  }

  get() {
    return this.authed.get(`/repos/${this.projectOwner}/${this.projectName}`)
  }
}

module.exports = GithubRepo

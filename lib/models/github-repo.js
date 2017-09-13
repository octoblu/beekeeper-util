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

  createRelease({ projectVersion, message, release, draft, prerelease }) {
    const json = {
      tag_name: `v${projectVersion}`,
      target_commitish: "master",
      name: `v${projectVersion}`,
      body: message,
      draft: draft || false,
      prerelease: prerelease || release == "prerelease",
    }

    return this.authed.post(`/repos/${this.projectOwner}/${this.projectName}/releases`, { json })
  }
}

module.exports = GithubRepo

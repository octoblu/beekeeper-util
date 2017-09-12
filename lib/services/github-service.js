const request = require("request-promise-native")
const bindAll = require("lodash/fp/bindAll")

class GithubService {
  constructor({ github, spinner }) {
    bindAll(Object.getOwnPropertyNames(GithubService.prototype), this)
    this.githubToken = github.token
    this.spinner = spinner
  }

  async isPrivate({ projectName, projectOwner }) {
    if (!projectName) throw new Error("GithubService.isPrivate requires projectName")
    if (!projectOwner) throw new Error("GithubService.isPrivate requires projectOwner")
    const { githubToken, spinner } = this
    const travisRepo = new GithubRepo({ projectName, projectOwner, githubToken })
    if (spinner) spinner.start("GitHub: Finding Repository")
    const repo = await travisRepo.get()
    return repo.private
  }
}

class GithubRepo {
  constructor({ projectName, projectOwner, githubToken }) {
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

module.exports = GithubService

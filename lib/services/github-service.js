const bindAll = require("lodash/fp/bindAll")
const GithubRepo = require("../models/github-repo")

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
    if (spinner) spinner.start("Github: Finding Repository")
    const repo = await travisRepo.get()
    return repo.private
  }
}

module.exports = GithubService

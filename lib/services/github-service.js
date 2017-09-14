const bindAll = require("lodash/fp/bindAll")
const GithubRepo = require("../models/github-repo")

class GithubService {
  constructor({ githubToken, githubReleaseEnabled, githubDraft, githubPrerelease, spinner }) {
    bindAll(Object.getOwnPropertyNames(GithubService.prototype), this)
    this.githubToken = githubToken
    this.githubReleaseEnabled = githubReleaseEnabled
    this.githubDraft = githubDraft
    this.githubPrerelease = githubPrerelease
    this.spinner = spinner
  }

  async isPrivate({ projectName, projectOwner }) {
    if (!projectName) throw new Error("GithubService.isPrivate requires projectName")
    if (!projectOwner) throw new Error("GithubService.isPrivate requires projectOwner")
    const { githubToken, spinner } = this
    const githubRepo = new GithubRepo({ projectName, projectOwner, githubToken })
    if (spinner) spinner.start("Github: Finding Repository")
    const repo = await githubRepo.get()
    return repo.private
  }

  async createRelease({ projectName, projectOwner, projectVersion, message, release }) {
    if (!this.githubReleaseEnabled) return
    if (!projectName) throw new Error("GithubService.createRelease requires projectName")
    if (!projectOwner) throw new Error("GithubService.createRelease requires projectOwner")
    const { githubToken, spinner, githubDraft, githubPrerelease } = this
    const draft = githubDraft
    const prerelease = githubPrerelease
    const githubRepo = new GithubRepo({ projectName, projectOwner, githubToken })
    if (spinner) spinner.start("Github: Creating Release")
    await githubRepo.createRelease({ projectVersion, message, release, draft, prerelease })
    if (spinner) spinner.log("Github: Release created")
  }
}

module.exports = GithubService

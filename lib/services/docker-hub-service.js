const bindAll = require("lodash/fp/bindAll")
const url = require("url")
const DockerHubRepo = require("../models/docker-hub-repo")

class DockerHubService {
  constructor({ dockerHubEnabled, dockerHubPassword, dockerHubUsername, spinner, beekeeperUri, beekeeperEnabled, mockDockerHubApi }) {
    bindAll(Object.getOwnPropertyNames(DockerHubService.prototype), this)
    if (dockerHubEnabled) {
      if (!dockerHubUsername) throw new Error("DockerHubService: requires dockerHubUsername")
      if (!dockerHubPassword) throw new Error("DockerHubService: requires dockerHubPassword")
    }
    if (beekeeperEnabled) {
      if (!beekeeperUri) throw new Error("DockerHubService: requires beekeeperUri")
      this.webhookUrl = this._getWebhookUrl(beekeeperUri)
    }
    this.dockerHubEnabled = dockerHubEnabled
    this.dockerHubUsername = dockerHubUsername
    this.dockerHubPassword = dockerHubPassword
    this.mockDockerHubApi = mockDockerHubApi
    this.spinner = spinner
  }

  async configure({ projectName, projectOwner, isPrivate }) {
    if (!this.dockerHubEnabled) return
    if (!projectName) throw new Error("DockerHubService.configure requires projectName")
    if (!projectOwner) throw new Error("DockerHubService.configure requires projectOwner")
    const { dockerHubUsername, dockerHubPassword, spinner, mockDockerHubApi, webhookUrl } = this
    const dockerHubRepo = new DockerHubRepo({
      projectName,
      projectOwner,
      isPrivate,
      webhookUrl,
      dockerHubUsername,
      dockerHubPassword,
      mockDockerHubApi,
    })
    if (spinner) spinner.start("DockerHub: Logging in")
    await dockerHubRepo.login()
    if (spinner) spinner.log("DockerHub: Logged in")
    if (spinner) spinner.start("DockerHub: Finding Repository")
    const repo = await dockerHubRepo.get()
    if (repo) {
      if (spinner) spinner.start("DockerHub: Updating Repository")
      await dockerHubRepo.update()
      if (spinner) spinner.log("DockerHub: Repository updated")
    } else {
      if (spinner) spinner.start("DockerHub: Creating Repository")
      await dockerHubRepo.create()
      if (spinner) spinner.log("DockerHub: Repository created")
    }
  }

  _getWebhookUrl(beekeeperUri) {
    const parts = url.parse(beekeeperUri)
    parts.slashes = true
    parts.pathname = "/webhooks/docker:hub"
    return url.format(parts)
  }
}

module.exports = DockerHubService

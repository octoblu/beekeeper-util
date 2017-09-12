const bindAll = require("lodash/fp/bindAll")
const url = require("url")
const DockerHubRepo = require("../models/docker-hub-repo")

class DockerHubService {
  constructor({ dockerHub, spinner, beekeeper, mockDockerHubApi }) {
    bindAll(Object.getOwnPropertyNames(DockerHubService.prototype), this)
    if (dockerHub.enabled) {
      if (!dockerHub.username) throw new Error("DockerHubService: requires dockerHub.username")
      if (!dockerHub.password) throw new Error("DockerHubService: requires dockerHub.password")
    }
    if (beekeeper.enabled) {
      if (!beekeeper.uri) throw new Error("DockerHubService: requires beekeeper.uri")
      this.webhookUrl = this._getWebhookUrl(beekeeper.uri)
    }
    this.dockerHubEnabled = dockerHub.enabled
    this.dockerHubUsername = dockerHub.username
    this.dockerHubPassword = dockerHub.password
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
      if (spinner) spinner.start("DockerHub: Upgrading Repository")
      await dockerHubRepo.upgrade()
      if (spinner) spinner.log("DockerHub: Repository upgraded")
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

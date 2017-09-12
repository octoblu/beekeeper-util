const dockerHubApi = require("@octoblu/docker-hub-api")
const bindAll = require("lodash/fp/bindAll")
const map = require("lodash/map")
const first = require("lodash/first")
const get = require("lodash/get")

class DockerHubRepo {
  constructor({
    projectName,
    projectOwner,
    dockerHubUsername,
    dockerHubPassword,
    isPrivate,
    mockDockerHubApi,
    webhookUrl,
  }) {
    bindAll(Object.getOwnPropertyNames(DockerHubRepo.prototype), this)
    this.projectName = projectName
    this.projectOwner = projectOwner
    this.dockerHubUsername = dockerHubUsername
    this.dockerHubPassword = dockerHubPassword
    this.dockerHubApi = mockDockerHubApi || dockerHubApi
    this.isPrivate = isPrivate
    this.webhookUrl = webhookUrl
    if (!projectName) throw new Error("DockerHubRepo requires projectName")
    if (!projectOwner) throw new Error("DockerHubRepo requires projectOwner")
    if (!dockerHubUsername) throw new Error("DockerHubRepo requires dockerHubUsername")
    if (!dockerHubPassword) throw new Error("DockerHubRepo requires dockerHubPassword")
  }

  login() {
    return this.dockerHubApi.login(this.dockerHubUsername, this.dockerHubPassword)
  }

  async get() {
    try {
      return await this.dockerHubApi.repository(this.projectOwner, this.projectName)
    } catch (error) {
      if (error.message === "Object not found") {
        return Promise.resolve()
      }
      return Promise.reject(error)
    }
  }

  async create() {
    await this._ensureRepository()
    await this._createWebhook()
  }

  async upgrade() {
    await this._deleteBuildTags()
    await this._ensureRepository()
    await this._createWebhook()
  }

  async _createWebhook() {
    if (!this.webhookUrl) return
    const result = await this.dockerHubApi.createWebhook(this.projectOwner, this.projectName, "Beekeeper v2")
    const existsError = first(get(result, "name"))
    if (existsError === "already exists") return
    const webhookId = get(result, "id")
    await this.dockerHubApi.createWebhookHook(this.projectOwner, this.projectName, webhookId, this.webhookUrl)
  }

  async _deleteBuildTags() {
    const { build_tags } = await this.dockerHubApi.buildSettings(this.projectOwner, this.projectName)
    return Promise.all(map(build_tags, this._deleteBuildTag))
  }

  _deleteBuildTag({ id }) {
    return this.dockerHubApi.deleteBuildTag(this.projectOwner, this.projectName, id)
  }

  _ensureRepository() {
    return this.dockerHubApi.createRepository(this.projectOwner, this.projectName, {
      active: true,
      description: `docker registry for ${this.projectOwner}/${this.projectName}`,
      is_private: this.isPrivate,
      provider: "github",
      vcs_repo_name: `${this.projectOwner}/${this.projectName}`,
    })
  }
}

module.exports = DockerHubRepo

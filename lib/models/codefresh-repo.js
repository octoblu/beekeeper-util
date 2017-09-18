const request = require("request-promise-native")
const bindAll = require("lodash/fp/bindAll")
const set = require("lodash/set")
const find = require("lodash/find")
const cloneDeep = require("lodash/cloneDeep")
const path = require("path")
const map = require("lodash/map")
const fs = require("fs-extra")
const isEmpty = require("lodash/isEmpty")

class CodefreshRepo {
  constructor({ projectName, projectOwner, isPrivate, codefreshToken, npmToken, beekeeperUri, projectRoot }) {
    bindAll(Object.getOwnPropertyNames(CodefreshRepo.prototype), this)
    this.projectName = projectName
    this.projectOwner = projectOwner
    this.projectRoot = projectRoot
    this.npmToken = npmToken
    this.beekeeperUri = beekeeperUri
    if (!projectName) throw new Error("CodefreshRepo requires projectName")
    if (!projectOwner) throw new Error("CodefreshRepo requires projectOwner")
    if (!projectRoot) throw new Error("CodefreshRepo requires projectRoot")
    if (!npmToken) throw new Error("CodefreshRepo requires npmToken")
    if (!beekeeperUri) throw new Error("CodefreshRepo requires beekeeperUri")
    this.isPrivate = isPrivate
    this.codefreshToken = codefreshToken
    const baseUrl = "https://g.codefresh.io/api"

    this.request = request.defaults({
      baseUrl,
      headers: {
        "User-Agent": "Beekeeper Util/1.0",
      },
      json: true,
    })
  }

  async init() {
    this.authedRequest = this.request.defaults({
      headers: {
        "x-access-token": this.codefreshToken,
      },
    })
    this.services = await this.getServices()
    this.registryId = await this.getRegistryId()
  }

  enable() {
    if (isEmpty(this.services)) {
      return this._createService()
    }
    return this._updateServices(this.services)
  }

  getServices() {
    return this.authedRequest.get(`/services/${this.projectOwner}/${this.projectName}`)
  }

  _getDefaults() {
    return this.authedRequest.get(`/services/${this.projectOwner}/${this.projectName}/default`)
  }

  async getRegistryId() {
    const registries = await this.authedRequest.get("/registries")
    const item = find(registries, { provider: "dockerhub" })
    if (!item) throw new Error("Docker Hub is not configured in codefresh")
    return item._id
  }

  _getWebhookBuildStrategy() {
    const codefreshFile = path.join(this.projectRoot, "codefresh.yml")
    try {
      fs.accessSync(codefreshFile, fs.constants.F_OK)
    } catch (error) {
      return "regular"
    }

    return "yaml"
  }

  _setServiceDefaults({ registryId, service }) {
    const webhookBuildStrategy = this._getWebhookBuildStrategy()
    service = cloneDeep(service)
    set(service, "deploy_sh", "")
    set(service, "integ_sh", "")
    set(service, "test_sh", "")
    set(service, "env", [
      {
        key: "BEEKEEPER_URI",
        value: this.beekeeperUri,
        encrypted: true,
      },
      {
        key: "NPM_TOKEN",
        value: this.npmToken,
        encrypted: true,
      },
    ])
    set(service, "useDockerfileFromRepo", true)
    set(service, "webhookBuildStrategy", webhookBuildStrategy)
    set(service, "registry", registryId)
    set(service, "imageName", `${this.projectOwner}/${this.projectName}`)
    set(service, "webhookFilter", [
      {
        regex: "/v.*/",
        type: "regex",
      },
    ])
    return service
  }

  async _createService() {
    const defaults = await this._getDefaults()
    return this._updateServices([defaults])
  }

  _updateServices(services) {
    const { registryId } = this
    const mappedServices = map(services, service => this._setServiceDefaults({ service, registryId }))
    const json = { services: mappedServices }

    return this.authedRequest.post(`/services/${this.projectOwner}/${this.projectName}`, { json })
  }
}

module.exports = CodefreshRepo

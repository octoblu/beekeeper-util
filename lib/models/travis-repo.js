const request = require("request-promise-native")
const { StatusCodeError } = require("request-promise-native/errors")
const bindAll = require("lodash/fp/bindAll")
const map = require("lodash/map")
const find = require("lodash/find")
const isEmpty = require("lodash/isEmpty")

class TravisRepo {
  constructor({ projectName, projectOwner, isPrivate, githubToken, travisOrgToken, travisComToken }) {
    bindAll(Object.getOwnPropertyNames(TravisRepo.prototype), this)
    this.projectName = projectName
    this.projectOwner = projectOwner
    if (!projectName) throw new Error("TravisRepo requires projectName")
    if (!projectOwner) throw new Error("TravisRepo requires projectOwner")
    this.isPrivate = isPrivate
    this.githubToken = githubToken
    this.travisToken = isPrivate ? travisComToken : travisOrgToken
    const baseUrl = isPrivate ? "https://api.travis-ci.com" : "https://api.travis-ci.org"

    this.request = request.defaults({
      baseUrl,
      headers: {
        "User-Agent": "Travis CI/1.0",
      },
      json: true,
    })
  }

  async init() {
    const accessToken = await this._getAccessToken()
    this.authedRequest = this.request.defaults({
      headers: {
        authorization: `token ${accessToken}`,
      },
    })
    let repo = await this._get()
    if (!repo) {
      await this._sync()
      repo = await this._get()
      if (!repo) {
        throw new Error("Repo not found in travis")
      }
    }
    this.repoId = repo.id
    this.envVars = await this._getEnvVars()
  }

  enable() {
    const json = {
      hook: {
        id: this.repoId,
        active: true,
      },
    }
    return this.authedRequest.put("/hooks", { json })
  }

  updateAllEnv(envs) {
    if (isEmpty(envs)) return Promise.resolve()
    return Promise.all(map(envs, this.upsertEnv))
  }

  upsertEnv({ name, value, env }) {
    if (!value && env) {
      value = process.env[env]
    }
    const existingEnv = find(this.envVars, { name })
    if (existingEnv) {
      const { id } = existingEnv
      return this._updateEnv({ name, value, id })
    }
    return this._createEnv({ name, value })
  }

  _createEnv({ name, value }) {
    const json = {
      env_var: {
        name,
        value,
        public: false,
      },
    }
    const qs = {
      repository_id: this.repoId,
    }
    return this.authedRequest.post(`/settings/env_vars`, { json, qs })
  }

  _updateEnv({ name, value, id }) {
    const json = {
      env_var: {
        name,
        value,
        public: false,
      },
    }
    const qs = {
      repository_id: this.repoId,
    }
    return this.authedRequest.patch(`/settings/env_vars/${id}`, { json, qs })
  }

  async _getAccessToken() {
    if (this.travisToken) return Promise.resolve(this.travisToken)
    const json = {
      github_token: this.githubToken,
    }
    const body = await this.request.post("/auth/github", { json })
    return body.access_token
  }

  _get() {
    const uri = `/repos/${this.projectOwner}/${this.projectName}`

    return this.authedRequest.get(uri).catch(error => {
      if (error instanceof StatusCodeError) {
        const { statusCode } = error.response
        if (statusCode === 404) {
          return Promise.resolve()
        }
      }
      return Promise.reject(error)
    })
  }

  async _getEnvVars() {
    const qs = {
      repository_id: this.repoId,
    }
    const body = await this.authedRequest.get("/settings/env_vars", { qs })
    return body.env_vars
  }

  _sync() {
    return this.authedRequest.post("/users/sync")
  }
}

module.exports = TravisRepo

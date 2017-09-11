const request = require("request-promise-native")
const { StatusCodeError } = require("request-promise-native/errors")
const bindAll = require("lodash/fp/bindAll")

class TravisService {
  constructor({ github }) {
    bindAll(Object.getOwnPropertyNames(TravisService.prototype), this)
    this.githubToken = github.token
  }

  async configure({ projectName, projectOwner, isPrivate }) {
    const { githubToken } = this
    const travisRepo = new TravisRepo({ projectName, projectOwner, isPrivate, githubToken })
    await travisRepo.init()
    await travisRepo.enable()
  }
}

class TravisRepo {
  constructor({ projectName, projectOwner, isPrivate, githubToken }) {
    bindAll(Object.getOwnPropertyNames(TravisRepo.prototype), this)
    this.projectName = projectName
    this.projectOwner = projectOwner
    this.isPrivate = isPrivate
    this.githubToken = githubToken
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

  async _getAccessToken() {
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

  _sync() {
    return this.authedRequest.post("/users/sync")
  }
}

module.exports = TravisService

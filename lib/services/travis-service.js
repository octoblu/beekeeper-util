const request = require("request")
const bindAll = require("lodash/fp/bindAll")

class TravisService {
  constructor({ github }) {
    bindAll(Object.getOwnPropertyNames(TravisService.prototype), this)
    this.githubToken = github.token
  }

  configure({ projectName, projectOwner, isPrivate }, callback) {
    const { githubToken } = this
    const travisRepo = new TravisRepo({ projectName, projectOwner, isPrivate, githubToken })
    travisRepo.init(error => {
      if (error) return callback(error)
      travisRepo.enable(callback)
    })
  }
}

class TravisRepo {
  constructor({ projectName, projectOwner, isPrivate, githubToken }) {
    bindAll(Object.getOwnPropertyNames(TravisRepo.prototype), this)
    this.projectName = projectName
    this.projectOwner = projectOwner
    this.isPrivate = isPrivate
    this.githubToken = githubToken
    this.request = request.defaults({
      baseUrl: "https://api.travis-ci.org",
      headers: {
        "User-Agent": "Travis CI/1.0",
      },
      json: true,
    })
  }

  init(callback) {
    this._getAccessToken((error, accessToken) => {
      if (error) return callback(error)
      this.authedRequest = this.request.defaults({
        headers: {
          authorization: `token ${accessToken}`,
        },
      })
      this._get((error, repo) => {
        if (error) return callback(error)
        this.repoId = repo.id
        callback()
      })
    })
  }

  _getAccessToken(callback) {
    const options = {
      uri: "/auth/github",
      method: "POST",
      json: {
        github_token: this.githubToken,
      },
    }

    this.request(options, (error, response) => {
      if (error) return callback(error)
      callback(null, response.body.access_token)
    })
  }

  _get(callback) {
    const options = {
      uri: `/repos/${this.projectOwner}/${this.projectName}`,
    }
    this.authedRequest(options, (error, response) => {
      if (error) return callback(error)
      callback(null, response.body)
    })
  }

  enable(callback) {
    const options = {
      method: "PUT",
      uri: "/hooks",
      json: {
        hook: {
          id: this.repoId,
          active: true,
        },
      },
    }
    this.authedRequest(options, (error, response) => {
      if (error) return callback(error)
      callback(error, response.body)
    })
  }
}

module.exports = TravisService

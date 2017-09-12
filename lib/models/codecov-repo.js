const request = require("request-promise-native")
const { StatusCodeError } = require("request-promise-native/errors")
const bindAll = require("lodash/fp/bindAll")

class CodecovRepo {
  constructor({ projectName, projectOwner, isPrivate, codecovToken }) {
    bindAll(Object.getOwnPropertyNames(CodecovRepo.prototype), this)
    this.projectName = projectName
    this.projectOwner = projectOwner
    if (!projectName) throw new Error("CodecovRepo requires projectName")
    if (!projectOwner) throw new Error("CodecovRepo requires projectOwner")
    this.isPrivate = isPrivate
    this.codecovToken = codecovToken
    const baseUrl = "https://codecov.io/api/gh"

    this.request = request.defaults({
      baseUrl,
      headers: {
        "User-Agent": "Beekeeper Util/1.0",
        Accept: "application/json",
      },
    })
  }

  async init() {
    this.authedRequest = this.request.defaults({
      headers: {
        authorization: `token ${this.codecovToken}`,
      },
    })
    let repo = await this.get()
    this.repoId = repo.id
  }

  enable() {
    const body = "action=activate"
    const uri = `/${this.projectOwner}/${this.projectName}/settings`
    return this.authedRequest.post(uri, { body })
  }

  get() {
    const uri = `/${this.projectOwner}/${this.projectName}`
    return this.authedRequest.get(uri, { json: true }).catch(error => {
      if (error instanceof StatusCodeError) {
        const { statusCode } = error.response
        if (statusCode === 404) {
          return Promise.resolve()
        }
      }
      return Promise.reject(error)
    })
  }
}

module.exports = CodecovRepo

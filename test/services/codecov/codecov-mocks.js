const nock = require("nock")
const bindAll = require("lodash/fp/bindAll")

class CodecovMocks {
  constructor({ codecovToken, isPrivate }) {
    this.isPrivate = isPrivate
    bindAll(Object.getOwnPropertyNames(CodecovMocks.prototype), this)

    this.authed = nock("https://codecov.io/api/gh")
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Beekeeper Util/1.0")
      .matchHeader("authorization", `token ${codecovToken}`)
  }

  getRepo() {
    if (!this.isPrivate) return this
    this.authed.get("/some-owner/example-repo-name").reply(200, {
      upload_token: "codecov-upload-token",
    })
    return this
  }

  enableRepo() {
    if (!this.isPrivate) return this
    this.authed.post("/some-owner/example-repo-name/settings", "action=activate").reply(204)
    return this
  }

  cleanup() {
    nock.cleanAll()
  }

  done() {
    this.authed.done()
  }
}

module.exports = CodecovMocks

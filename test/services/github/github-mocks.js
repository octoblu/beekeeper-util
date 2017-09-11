const nock = require("nock")
const bindAll = require("lodash/fp/bindAll")

class GithubMocks {
  constructor({ githubToken }) {
    bindAll(Object.getOwnPropertyNames(GithubMocks.prototype), this)

    this.authed = nock("https://api.github.com")
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Beekeeper Util/1.0")
      .matchHeader("authorization", `token ${githubToken}`)
  }

  getRepo() {
    this.authed.get("/repos/some-owner/example-repo-name").reply(200, {
      private: true,
    })
    return this
  }

  cleanup() {
    nock.cleanAll()
  }

  done() {
    this.authed.done()
  }
}

module.exports = GithubMocks

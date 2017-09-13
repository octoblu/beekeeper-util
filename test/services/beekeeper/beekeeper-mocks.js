const nock = require("nock")
const bindAll = require("lodash/fp/bindAll")

class BeekeeperMocks {
  constructor({ isPrivate }) {
    this.isPrivate = isPrivate
    bindAll(Object.getOwnPropertyNames(BeekeeperMocks.prototype), this)

    this.authed = nock("https://beekeeper.octoblu.com")
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Beekeeper Util/1.0")
  }

  createDeployment(tag) {
    this.authed.post(`/deployments/some-owner/example-repo-name/${tag}`).reply(204)
    return this
  }

  deleteDeployment(tag) {
    this.authed.delete(`/deployments/some-owner/example-repo-name/${tag}`).reply(204)
    return this
  }

  cleanup() {
    nock.cleanAll()
  }

  done() {
    this.authed.done()
  }
}

module.exports = BeekeeperMocks

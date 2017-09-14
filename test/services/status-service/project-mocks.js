const nock = require("nock")
const bindAll = require("lodash/fp/bindAll")

class ProjectMocks {
  constructor() {
    bindAll(Object.getOwnPropertyNames(ProjectMocks.prototype), this)

    this.request = nock("https://some-repo.example.com")
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Beekeeper Util/1.0")
  }

  getVersion(version) {
    this.request.get(`/version`).reply(200, {
      version,
    })
    return this
  }

  cleanup() {
    nock.cleanAll()
  }

  done() {
    this.request.done()
  }
}

module.exports = ProjectMocks

const { beforeEach, afterEach, describe, it } = global
const { expect } = require("chai")
const TravisService = require("../../../lib/services/travis-service")
const TravisMocks = require("./travis-mocks")

describe("Travis: is rate limited", function() {
  describe("when travis responds with a 403", function() {
    beforeEach("create service", function() {
      this.sut = new TravisService({
        travisEnv: this.envVars,
        githubToken: "github-token",
        travisEnabled: true,
      })
    })

    beforeEach("setup travis mocks", function() {
      this.travisMocks = new TravisMocks({
        githubToken: "github-token",
        isPrivate: false,
      })
    })

    afterEach("clean up travis mocks", function() {
      this.travisMocks.cleanup()
    })

    beforeEach("setup travis endpoints", function() {
      this.travisMocks.authed.get("/repos/some-owner/example-repo-name").reply(403)
    })

    it("should be rejected", function() {
      const options = {
        projectName: "example-repo-name",
        projectOwner: "some-owner",
        isPrivate: false,
      }
      expect(this.sut.configure(options)).to.be.rejected
    })
  })
})

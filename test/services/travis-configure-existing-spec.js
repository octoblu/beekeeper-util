const { beforeEach, afterEach, describe, it } = global
const { expect } = require("chai")
const TravisService = require("../../lib/services/travis-service")
const TravisMocks = require("./travis-mocks")

describe("Configure an existing travis-ci project", function() {
  beforeEach("create service", function() {
    this.sut = new TravisService({
      github: {
        token: "github-token",
      },
      travis: {
        env: [
          {
            value: "some-value",
            name: "SOME_ENV_NAME",
          },
        ],
      },
    })
  })

  describe("when the repo is public", function() {
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
      const envVars = [{ name: "SOME_ENV_NAME", id: "some-env-id", value: "some-value" }]
      this.travisMocks
        .getRepo()
        .enableRepo()
        .getEnvVars(envVars)
        .updateEnvVars(envVars)
    })

    beforeEach("call configure", function() {
      const options = {
        projectName: "example-repo-name",
        projectOwner: "some-owner",
        isPrivate: false,
      }
      return this.sut.configure(options)
    })

    it("should call of the travis endpoints", function() {
      this.travisMocks.done()
    })
  })

  describe("when the repo is private", function() {
    beforeEach("setup travis mocks", function() {
      this.travisMocks = new TravisMocks({
        githubToken: "github-token",
        isPrivate: true,
      })
    })

    afterEach("clean up travis mocks", function() {
      this.travisMocks.cleanup()
    })

    beforeEach("setup travis endpoint", function() {
      const envVars = [{ name: "SOME_ENV_NAME", id: "some-env-id", value: "some-value" }]
      this.travisMocks
        .getRepo()
        .enableRepo()
        .getEnvVars(envVars)
        .updateEnvVars(envVars)
    })

    beforeEach("call configure", function() {
      const options = {
        projectName: "example-repo-name",
        projectOwner: "some-owner",
        isPrivate: true,
      }
      return this.sut.configure(options)
    })

    it("should call of the travis endpoints", function() {
      this.travisMocks.done()
    })
  })

  describe("when travis responds with a 403", function() {
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

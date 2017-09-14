const { beforeEach, afterEach, describe, it } = global
const CodecovService = require("../../../lib/services/codecov-service")
const CodecovMocks = require("./codecov-mocks")
const TravisMocks = require("../travis/travis-mocks")
const each = require("lodash/each")
const privates = [true, false]

describe("Codecov: Configure an existing project", function() {
  each(privates, function(isPrivate) {
    describe(`isPrivate: ${isPrivate}`, function() {
      beforeEach("create service", function() {
        this.sut = new CodecovService({
          githubToken: "github-token",
          travisEnabled: true,
          codecovToken: "codecov-token",
          codecovEnabled: true,
        })
      })

      beforeEach("setup codecov mocks", function() {
        this.codecovMocks = new CodecovMocks({
          codecovToken: "codecov-token",
          isPrivate,
        })
      })

      beforeEach("setup travis mocks", function() {
        this.travisMocks = new TravisMocks({
          githubToken: "github-token",
          isPrivate,
        })
      })

      afterEach("clean up codecov mocks", function() {
        this.codecovMocks.cleanup()
      })

      afterEach("clean up travis mocks", function() {
        this.travisMocks.cleanup()
      })

      beforeEach("setup codecov endpoints", function() {
        this.codecovMocks
          .getRepo()
          .enableRepo()
          .getRepo()
      })

      beforeEach("setup travis mocks endpoints", function() {
        if (!isPrivate) return
        this.travisMocks
          .auth()
          .getRepo()
          .enableRepo()
          .getEnvVars([{ name: "CODECOV_TOKEN", id: "codecov-token-id", value: "codecov-upload-token" }])
          .updateEnvVars([{ name: "CODECOV_TOKEN", id: "codecov-token-id", value: "codecov-upload-token" }])
      })

      beforeEach("call configure", function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate,
        }
        return this.sut.configure(options)
      })

      it("should call all of the codecov endpoints", function() {
        this.codecovMocks.done()
      })

      it("should call all of the travis endpoints", function() {
        this.travisMocks.done()
      })
    })
  })
})

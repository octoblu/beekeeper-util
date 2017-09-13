const { beforeEach, afterEach, describe, it } = global
const TravisService = require("../../../lib/services/travis-service")
const TravisMocks = require("./travis-mocks")
const each = require("lodash/each")
const privates = [true, false]

describe("Travis: Configure an existing project", function() {
  each(privates, function(isPrivate) {
    describe(`isPrivate: ${isPrivate}`, function() {
      beforeEach("create service", function() {
        process.env.EXTERNAL_SOME_OTHER_ENV_NAME = "some-other-value"
        this.envVars = [
          { name: "SOME_ENV_NAME", id: "some-env-id", value: "some-value" },
          { name: "SOME_OTHER_ENV_NAME", id: "some-other-env-id", env: "EXTERNAL_SOME_OTHER_ENV_NAME" },
        ]

        this.sut = new TravisService({
          travisEnv: this.envVars,
          githubToken: "github-token",
          travisEnabled: true,
        })
      })

      beforeEach("setup travis mocks", function() {
        this.travisMocks = new TravisMocks({
          githubToken: "github-token",
          isPrivate,
        })
      })

      afterEach("clean up travis mocks", function() {
        this.travisMocks.cleanup()
      })

      beforeEach("setup travis endpoints", function() {
        this.travisMocks
          .auth()
          .getRepo()
          .enableRepo()
          .getEnvVars(this.envVars)
          .updateEnvVars(this.envVars)
      })

      beforeEach("call configure", function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate,
        }
        return this.sut.configure(options)
      })

      it("should call of the travis endpoints", function() {
        this.travisMocks.done()
      })
    })
  })
})

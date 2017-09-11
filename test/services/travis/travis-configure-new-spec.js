const { beforeEach, afterEach, describe, it } = global
const TravisService = require("../../../lib/services/travis-service")
const TravisMocks = require("./travis-mocks")
const each = require("lodash/each")

const privates = [true, false]

describe("Travis: Configure a new project", function() {
  each(privates, function(isPrivate) {
    describe(`isPrivate: ${isPrivate}`, function() {
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
        const envVars = [{ name: "SOME_ENV_NAME", value: "some-value" }]
        this.travisMocks
          .getRepoWithSync()
          .enableRepo()
          .getEnvVars([])
          .createEnvVars(envVars)
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

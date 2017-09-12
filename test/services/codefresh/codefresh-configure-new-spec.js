const { beforeEach, afterEach, describe, it } = global
const CodefreshService = require("../../../lib/services/codefresh-service")
const CodefreshMocks = require("./codefresh-mocks")
const each = require("lodash/each")
const privates = [true, false]

describe("Codefresh: Configure a new project", function() {
  each(privates, function(isPrivate) {
    describe(`isPrivate: ${isPrivate}`, function() {
      beforeEach("create service", function() {
        this.sut = new CodefreshService({
          npm: {
            token: "npm-token",
          },
          project: {
            root: "~/tmp",
            hasDockerfile: true,
          },
          beekeeper: {
            uri: "http://localhost:3000",
          },
          codefresh: {
            enabled: true,
            token: "codefresh-token",
          },
        })
      })

      beforeEach("setup codefresh mocks", function() {
        this.codefreshMocks = new CodefreshMocks({
          codefreshToken: "codefresh-token",
          isPrivate,
        })
      })

      afterEach("clean up codefresh mocks", function() {
        this.codefreshMocks.cleanup()
      })

      beforeEach("setup codefresh endpoints", function() {
        this.codefreshMocks
          .getServices([])
          .getDefaults()
          .getRegistries()
          .upsertServices()
      })

      beforeEach("call configure", function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate,
        }
        return this.sut.configure(options)
      })

      it("should call of the codefresh endpoints", function() {
        this.codefreshMocks.done()
      })
    })
  })
})

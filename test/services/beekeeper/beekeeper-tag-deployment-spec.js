const { beforeEach, afterEach, describe, it } = global
const BeekeeperService = require("../../../lib/services/beekeeper-service")
const BeekeeperMocks = require("./beekeeper-mocks")
const each = require("lodash/each")
const privates = [true, false]

describe("Beekeeper: Tag a deployment", function() {
  each(privates, function(isPrivate) {
    describe(`isPrivate: ${isPrivate}`, function() {
      beforeEach("create service", function() {
        this.sut = new BeekeeperService({
          beekeeper: {
            uri: "https://beekeeper.octoblu.com",
            enabled: true,
          },
        })
      })

      beforeEach("setup beekeeper mocks", function() {
        this.beekeeperMocks = new BeekeeperMocks({
          beekeeperToken: "beekeeper-token",
          isPrivate,
        })
      })

      afterEach("clean up beekeeper mocks", function() {
        this.beekeeperMocks.cleanup()
      })

      beforeEach("setup beekeeper endpoints", function() {
        this.beekeeperMocks.tagDeployment({ tag: "v1.0.0", tagName: "foo" })
      })

      beforeEach("call createDeployment", function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate,
          projectVersion: "1.0.0",
          tagName: "foo",
        }
        return this.sut.tagDeployment(options)
      })

      it("should call all of the beekeeper endpoints", function() {
        this.beekeeperMocks.done()
      })
    })
  })
})

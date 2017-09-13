const { beforeEach, afterEach, describe, it } = global
const BeekeeperService = require("../../../lib/services/beekeeper-service")
const BeekeeperMocks = require("./beekeeper-mocks")
const each = require("lodash/each")
const privates = [true, false]

describe("Beekeeper: Configure an existing project", function() {
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
        this.beekeeperMocks.createDeployment("v1.0.0")
      })

      beforeEach("call createDeployment", function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate,
          projectVersion: "1.0.0",
        }
        return this.sut.createDeployment(options)
      })

      it("should call all of the beekeeper endpoints", function() {
        this.beekeeperMocks.done()
      })
    })
  })
})

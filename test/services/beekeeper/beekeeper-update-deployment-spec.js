const { beforeEach, afterEach, describe, it } = global
const BeekeeperService = require("../../../lib/services/beekeeper-service")
const BeekeeperMocks = require("./beekeeper-mocks")
const each = require("lodash/each")
const privates = [true, false]

describe("Beekeeper: Update an existing deployment", function() {
  each(privates, function(isPrivate) {
    describe(`isPrivate: ${isPrivate}`, function() {
      beforeEach("create service", function() {
        this.sut = new BeekeeperService({
          beekeeperUri: "https://beekeeper.octoblu.com",
          beekeeperEnabled: true,
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
        this.beekeeperMocks.updateDeployment("v1.0.0", "http://docker.com")
      })

      beforeEach("call updateDeployment", function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate,
          projectVersion: "1.0.0",
          dockerUrl: "http://docker.com",
        }
        return this.sut.updateDeployment(options)
      })

      it("should call all of the beekeeper endpoints", function() {
        this.beekeeperMocks.done()
      })
    })
  })
})

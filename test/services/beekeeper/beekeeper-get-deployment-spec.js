const { beforeEach, afterEach, describe, it, expect } = global
const BeekeeperService = require("../../../lib/services/beekeeper-service")
const BeekeeperMocks = require("./beekeeper-mocks")
const each = require("lodash/each")
const privates = [true, false]

describe("Beekeeper: Get deployment", function() {
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
        this.beekeeperMocks.getDeployment("v1.0.0")
      })

      beforeEach("call getDeployment", async function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          projectVersion: "1.0.0",
        }
        this.result = await this.sut.getDeployment(options)
      })

      it("should call all of the beekeeper endpoints", function() {
        this.beekeeperMocks.done()
      })

      it("should have the correct result", function() {
        expect(this.result).to.deep.equal({ tag: "v1.0.0" })
      })
    })
  })
})

const { beforeEach, afterEach, describe, it } = global
const StatusService = require("../../../lib/services/status-service")
const BeekeeperMocks = require("../beekeeper/beekeeper-mocks")

describe("Status: get the status of a service", function() {
  describe(`when the status is pending`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
      })
    })

    beforeEach("setup beekeeper mocks", function() {
      this.beekeeperMocks = new BeekeeperMocks()
    })

    afterEach("clean up beekeeper mocks", function() {
      this.beekeeperMocks.cleanup()
    })

    beforeEach("setup beekeeper endpoints", function() {
      this.beekeeperMocks
        .auth()
        .getRepoWithSync()
        .enableRepo()
        .getEnvVars([])
        .createEnvVars(this.envVars)
    })

    beforeEach("call configure", function() {
      const options = {
        projectName: "example-repo-name",
        projectOwner: "some-owner",
        isPrivate,
      }
      return this.sut.configure(options)
    })

    it("should call of the beekeeper endpoints", function() {
      this.beekeeperMocks.done()
    })
  })
})

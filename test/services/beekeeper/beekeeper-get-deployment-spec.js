const { beforeEach, afterEach, describe, it, expect } = global
const BeekeeperService = require("../../../lib/services/beekeeper-service")
const BeekeeperMocks = require("./beekeeper-mocks")

describe("Beekeeper: Get deployment", function() {
  beforeEach("create service", function() {
    this.sut = new BeekeeperService({
      beekeeperUri: "https://beekeeper.octoblu.com",
      beekeeperEnabled: true,
    })
  })

  beforeEach("setup beekeeper mocks", function() {
    this.beekeeperMocks = new BeekeeperMocks({
      beekeeperToken: "beekeeper-token",
      isPrivate: false,
    })
  })

  afterEach("clean up beekeeper mocks", function() {
    this.beekeeperMocks.cleanup()
  })

  describe(`when it exists`, function() {
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
      expect(this.result).to.deep.equal({
        tag: "v1.0.0",
        owner_name: "some-owner",
        repo_name: "example-repo-name",
        ci_passing: true,
        docker_url: "some-owner/example-repo-name:v1.0.0",
        tags: [],
      })
    })
  })

  describe(`when filtering by tags`, function() {
    beforeEach("setup beekeeper endpoints", function() {
      this.beekeeperMocks.getDeployment("v1.0.0", ["awesome"])
    })

    beforeEach("call getDeployment", async function() {
      const options = {
        projectName: "example-repo-name",
        projectOwner: "some-owner",
        projectVersion: "1.0.0",
        filterTags: ["awesome"],
      }
      this.result = await this.sut.getDeployment(options)
    })

    it("should call all of the beekeeper endpoints", function() {
      this.beekeeperMocks.done()
    })

    it("should have the correct result", function() {
      expect(this.result).to.deep.equal({
        tag: "v1.0.0",
        owner_name: "some-owner",
        repo_name: "example-repo-name",
        ci_passing: true,
        docker_url: "some-owner/example-repo-name:v1.0.0",
        tags: ["awesome"],
      })
    })
  })

  describe(`when it does not exist`, function() {
    beforeEach("setup beekeeper endpoints", function() {
      this.beekeeperMocks.getMissingDeployment("v1.0.0")
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
      expect(this.result).to.not.exist
    })
  })
})

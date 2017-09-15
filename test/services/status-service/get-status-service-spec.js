const { beforeEach, afterEach, describe, expect, it } = global
const StatusService = require("../../../lib/services/status-service")
const BeekeeperMocks = require("../beekeeper/beekeeper-mocks")
const ProjectMocks = require("./project-mocks")

describe("Status: get the status of a service", function() {
  describe("when there is a project uri", function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
        dockerEnabled: true,
      })
    })

    beforeEach("setup beekeeper mocks", function() {
      this.beekeeperMocks = new BeekeeperMocks({ isPrivate: false })
    })

    beforeEach("setup project mocks", function() {
      this.projectMocks = new ProjectMocks()
    })

    afterEach("clean up beekeeper mocks", function() {
      this.beekeeperMocks.cleanup()
    })

    afterEach("clean up project mocks", function() {
      this.projectMocks.cleanup()
    })

    beforeEach("setup beekeeper endpoints", function() {
      this.beekeeperMocks
        .getDeployment("v1.0.0")
        .getDeployment("latest")
        .getDeployment("v2.0.0")
    })

    beforeEach("setup project endpoints", function() {
      this.projectMocks.getVersion("v2.0.0")
    })

    beforeEach("call get", async function() {
      const options = {
        projectName: "example-repo-name",
        projectOwner: "some-owner",
        projectVersion: "v1.0.0",
      }
      this.result = await this.sut.get(options)
    })

    it("should call of the beekeeper endpoints", function() {
      this.beekeeperMocks.done()
    })

    it("should call of the project endpoints", function() {
      this.projectMocks.done()
    })

    it("should give respond with the correct result", function() {
      expect(this.result).to.deep.equal({
        current: {
          ci_passing: true,
          docker_url: "some-owner/example-repo-name:v1.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v1.0.0",
          tags: [],
        },
        latest: {
          ci_passing: true,
          docker_url: "some-owner/example-repo-name:latest",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "latest",
          tags: [],
        },
        running: {
          ci_passing: true,
          docker_url: "some-owner/example-repo-name:v2.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v2.0.0",
          tags: [],
        },
      })
    })
  })

  describe("when there is no project uri", function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        dockerEnabled: true,
      })
    })

    beforeEach("setup beekeeper mocks", function() {
      this.beekeeperMocks = new BeekeeperMocks({ isPrivate: false })
    })

    afterEach("clean up beekeeper mocks", function() {
      this.beekeeperMocks.cleanup()
    })

    beforeEach("setup beekeeper endpoints", function() {
      this.beekeeperMocks.getDeployment("v1.0.0").getDeployment("latest")
    })

    beforeEach("call get", async function() {
      const options = {
        projectName: "example-repo-name",
        projectOwner: "some-owner",
        projectVersion: "v1.0.0",
      }
      this.result = await this.sut.get(options)
    })

    it("should call of the beekeeper endpoints", function() {
      this.beekeeperMocks.done()
    })

    it("should give respond with the correct result", function() {
      expect(this.result).to.deep.equal({
        current: {
          ci_passing: true,
          docker_url: "some-owner/example-repo-name:v1.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v1.0.0",
          tags: [],
        },
        latest: {
          ci_passing: true,
          docker_url: "some-owner/example-repo-name:latest",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "latest",
          tags: [],
        },
        running: null,
      })
    })
  })
})

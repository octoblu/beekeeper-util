const { beforeEach, describe, expect, it } = global
const StatusService = require("../../../lib/services/status-service")

describe("Status: render the status of a docker disabled service", function() {
  describe(`when the status is deployed`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
        dockerEnabled: false,
        disableColors: true,
      })
    })

    beforeEach("call render", async function() {
      const options = {
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
          docker_url: "some-owner/example-repo-name:v1.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v1.0.0",
          tags: [],
        },
        running: {
          ci_passing: true,
          docker_url: "some-owner/example-repo-name:v1.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v1.0.0",
          tags: [],
        },
      }
      this.result = await this.sut.render(options)
    })

    it("should give respond with the correct template", function() {
      const template = `Status: Deployed
Current:
  Tag: v1.0.0
  CI Build: passed
Latest:
  Tag: v1.0.0
  CI Build: passed
Running:
  Tag: v1.0.0
  CI Build: passed`
      expect(this.result).to.equal(template)
    })
  })

  describe(`when the status is deploying`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
        dockerEnabled: false,
        disableColors: true,
      })
    })

    beforeEach("call render", async function() {
      const options = {
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
          docker_url: "some-owner/example-repo-name:v2.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v2.0.0",
          tags: [],
        },
        running: {
          ci_passing: true,
          docker_url: "some-owner/example-repo-name:v1.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v1.0.0",
          tags: [],
        },
      }
      this.result = await this.sut.render(options)
    })

    it("should give respond with the correct template", function() {
      const template = `Status: Deploying...
Current:
  Tag: v1.0.0
  CI Build: passed
Latest:
  Tag: v2.0.0
  CI Build: passed
Running:
  Tag: v1.0.0
  CI Build: passed`
      expect(this.result).to.equal(template)
    })
  })

  describe(`when missing all of the deployments`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
        disableColors: true,
        dockerEnabled: false,
      })
    })

    beforeEach("call render", async function() {
      const options = {
        current: null,
        latest: null,
        running: null,
      }
      this.result = await this.sut.render(options)
    })

    it("should give respond with the correct template", function() {
      const template = `Error: Deployment not found
Current:
  Error: Not found
Latest:
  Error: Not found
Running:
  Error: Not found`
      expect(this.result).to.equal(template)
    })
  })

  describe(`when the status is deploying`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
        dockerEnabled: false,
        disableColors: true,
      })
    })

    beforeEach("call render", async function() {
      const options = {
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
          docker_url: "some-owner/example-repo-name:v2.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v2.0.0",
          tags: [],
        },
        running: {
          ci_passing: true,
          docker_url: "some-owner/example-repo-name:v1.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v1.0.0",
          tags: [],
        },
      }
      this.result = await this.sut.render(options)
    })

    it("should give respond with the correct template", function() {
      const template = `Status: Deploying...
Current:
  Tag: v1.0.0
  CI Build: passed
Latest:
  Tag: v2.0.0
  CI Build: passed
Running:
  Tag: v1.0.0
  CI Build: passed`
      expect(this.result).to.equal(template)
    })
  })

  describe(`when status is pending`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
        dockerEnabled: false,
        disableColors: true,
      })
    })

    beforeEach("call render", async function() {
      const options = {
        current: {
          docker_url: "some-owner/example-repo-name:v1.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v1.0.0",
          tags: [],
        },
        latest: {
          ci_passing: false,
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v2.0.0",
          tags: [],
        },
        running: {
          ci_passing: true,
          docker_url: "some-owner/example-repo-name:v1.0.0",
          owner_name: "some-owner",
          repo_name: "example-repo-name",
          tag: "v1.0.0",
          tags: [],
        },
      }
      this.result = await this.sut.render(options)
    })

    it("should give respond with the correct template", function() {
      const template = `Status: Pending...
Current:
  Tag: v1.0.0
  CI Build: pending...
Latest:
  Tag: v2.0.0
  CI Build: failed
Running:
  Tag: v1.0.0
  CI Build: passed`
      expect(this.result).to.equal(template)
    })
  })
})

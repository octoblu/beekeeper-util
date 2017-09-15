const { beforeEach, describe, expect, it } = global
const StatusService = require("../../../lib/services/status-service")

describe("Status: render the status of a docker enabled service", function() {
  describe(`when the status is deployed`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
        dockerEnabled: true,
      })
    })

    beforeEach("call render", async function() {
      const options = {
        desired: {
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
      const template = `
      Status: Deployed
      Desired:
        Tag: v1.0.0
        CI Build: passed
        Docker URL: some-owner/example-repo-name:v1.0.0
      Latest:
        Tag: v1.0.0
        CI Build: passed
        Docker URL: some-owner/example-repo-name:v1.0.0
      Running:
        Tag: v1.0.0
        CI Build: passed
        Docker URL: some-owner/example-repo-name:v1.0.0
      `
      expect(this.result).to.equal(template.trim())
    })
  })

  describe(`when the status is deploying`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
        dockerEnabled: true,
      })
    })

    beforeEach("call render", async function() {
      const options = {
        desired: {
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
      const template = `
      Status: Deploying...
      Desired:
        Tag: v1.0.0
        CI Build: passed
        Docker URL: some-owner/example-repo-name:v1.0.0
      Latest:
        Tag: v2.0.0
        CI Build: passed
        Docker URL: some-owner/example-repo-name:v2.0.0
      Running:
        Tag: v1.0.0
        CI Build: passed
        Docker URL: some-owner/example-repo-name:v1.0.0
      `
      expect(this.result).to.equal(template.trim())
    })
  })

  describe(`when missing all of the deployments`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
      })
    })

    beforeEach("call render", async function() {
      const options = {
        desired: null,
        latest: null,
        running: null,
      }
      this.result = await this.sut.render(options)
    })

    it("should give respond with the correct template", function() {
      const template = `
      Error: Deployment not found
      Desired:
        Error: Not found
      Latest:
        Error: Not found
      Running:
        Error: Not found
      `
      expect(this.result).to.equal(template.trim())
    })
  })

  describe(`when the status is deploying`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
        dockerEnabled: true,
      })
    })

    beforeEach("call render", async function() {
      const options = {
        desired: {
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
      const template = `
      Status: Deploying...
      Desired:
        Tag: v1.0.0
        CI Build: passed
        Docker URL: some-owner/example-repo-name:v1.0.0
      Latest:
        Tag: v2.0.0
        CI Build: passed
        Docker URL: some-owner/example-repo-name:v2.0.0
      Running:
        Tag: v1.0.0
        CI Build: passed
        Docker URL: some-owner/example-repo-name:v1.0.0
      `
      expect(this.result).to.equal(template.trim())
    })
  })

  describe(`when status is pending`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
        dockerEnabled: true,
      })
    })

    beforeEach("call render", async function() {
      const options = {
        desired: {
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
      const template = `
      Status: Pending...
      Desired:
        Tag: v1.0.0
        CI Build: pending...
        Docker URL: some-owner/example-repo-name:v1.0.0
      Latest:
        Tag: v2.0.0
        CI Build: failed
        Docker URL: pending...
      Running:
        Tag: v1.0.0
        CI Build: passed
        Docker URL: some-owner/example-repo-name:v1.0.0
      `
      expect(this.result).to.equal(template.trim())
    })
  })
})

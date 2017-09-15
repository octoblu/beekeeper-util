const { beforeEach, describe, expect, it } = global
const StatusService = require("../../../lib/services/status-service")

describe("Status: render the status of a service", function() {
  describe(`when the status is valid`, function() {
    beforeEach("create service", function() {
      this.sut = new StatusService({
        beekeeperUri: "https://beekeeper.octoblu.com",
        beekeeperEnabled: true,
        projectUri: "https://some-repo.example.com",
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
      }
      this.result = await this.sut.render(options)
    })

    it("should give respond with the correct template", function() {
      const template = `
      Desired: some-owner/example-repo-name:v1.0.0
      Latest: some-owner/example-repo-name:latest
      Running: some-owner/example-repo-name:v2.0.0
      `
      expect(this.result).to.equal(template.trim())
    })
  })
})

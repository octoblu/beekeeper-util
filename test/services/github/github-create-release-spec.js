const { beforeEach, afterEach, describe, it } = global
const GithubService = require("../../../lib/services/github-service")
const GithubMocks = require("./github-mocks")

describe("Github: check createRelease", function() {
  beforeEach("create service", function() {
    this.sut = new GithubService({
      githubReleaseEnabled: true,
      githubToken: "github-token",
    })
  })

  beforeEach("setup github mocks", function() {
    this.githubMocks = new GithubMocks({ githubToken: "github-token" })
  })

  afterEach("clean up github mocks", function() {
    this.githubMocks.cleanup()
  })

  beforeEach("setup github endpoints", function() {
    this.githubMocks.createRelease()
  })

  beforeEach("call createRelease", function() {
    const options = {
      projectName: "example-repo-name",
      projectOwner: "some-owner",
      projectVersion: "1.0.0",
      message: "some message",
      release: "init",
    }
    return this.sut.createRelease(options)
  })

  it("should call of the github endpoints", function() {
    this.githubMocks.done()
  })
})

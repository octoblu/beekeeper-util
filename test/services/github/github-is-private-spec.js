const { beforeEach, afterEach, describe, it } = global
const GithubService = require("../../../lib/services/github-service")
const GithubMocks = require("./github-mocks")

describe("Github: check isPrivate", function() {
  beforeEach("create service", function() {
    this.sut = new GithubService({
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
    this.githubMocks.getRepo()
  })

  beforeEach("call isPrivate", function() {
    const options = {
      projectName: "example-repo-name",
      projectOwner: "some-owner",
    }
    return this.sut.isPrivate(options)
  })

  it("should call of the github endpoints", function() {
    this.githubMocks.done()
  })
})

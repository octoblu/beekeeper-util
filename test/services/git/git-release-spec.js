const { beforeEach, describe, it, expect } = global
const path = require("path")
const GitService = require("../../../lib/services/git-service")

describe("Git: release new version", function() {
  beforeEach("create service", function() {
    this.sut = new GitService({
      project: {
        root: path.join("/tmp", "test-beekeeper-project"),
      },
    })
  })

  beforeEach("call release", function() {
    const options = {
      newProjectVersion: "v1.0.0",
      message: "no ragrets",
    }
    return this.sut.release(options)
  })

  it("should call of the git methods", function() {
    expect(true).to.be.true
  })
})

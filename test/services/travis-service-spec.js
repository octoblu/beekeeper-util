const { beforeEach, afterEach, describe, it } = global
const { expect } = require("chai")
const nock = require("nock")
const TravisService = require("../../lib/services/travis-service")

describe("TravisService", function() {
  beforeEach("create service", function() {
    this.sut = new TravisService({
      github: {
        token: "github-token",
      },
    })
  })

  afterEach(function() {
    nock.cleanAll()
  })

  describe("->configure", function() {
    describe("when travis have never been setup", function() {
      beforeEach("call configure", function(done) {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate: false,
        }
        this.travis = nock("https://api.travis-ci.org")
          .matchHeader("accept", "application/json")
          .matchHeader("user-agent", "Travis CI/1.0")
          .post("/auth/github", { github_token: "github-token" })
          .reply(200, { access_token: "foobar" })
          .get("/repos/some-owner/example-repo-name")
          .matchHeader("authorization", "token foobar")
          .reply(200, {
            id: "travis-repo-id",
          })
          .put("/hooks", {
            hook: {
              id: "travis-repo-id",
              active: true,
            },
          })
          .matchHeader("authorization", "token foobar")
          .reply(204)
        this.sut.configure(options, done)
      })

      it("should call of the travis endpoints", function() {
        this.travis.done()
      })
    })
  })
})

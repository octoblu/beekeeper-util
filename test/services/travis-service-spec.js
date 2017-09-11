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

  beforeEach("setup travis mocks", function() {
    this.travisOrg = nock("https://api.travis-ci.org")
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Travis CI/1.0")
      .post("/auth/github", { github_token: "github-token" })
      .reply(200, { access_token: "foobar" })
    this.travisCom = nock("https://api.travis-ci.com")
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Travis CI/1.0")
      .post("/auth/github", { github_token: "github-token" })
      .reply(200, { access_token: "foobar" })
    this.travisOrgAuthed = nock("https://api.travis-ci.org")
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Travis CI/1.0")
      .matchHeader("authorization", "token foobar")
    this.travisComAuthed = nock("https://api.travis-ci.com")
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Travis CI/1.0")
      .matchHeader("authorization", "token foobar")
  })

  describe("->configure", function() {
    describe("when travis have never been setup", function() {
      beforeEach("setup travis endpoints", function() {
        this.travisOrgAuthed
          .get("/repos/some-owner/example-repo-name")
          .reply(404)
          .post("/users/sync")
          .reply(200)
          .get("/repos/some-owner/example-repo-name")
          .reply(200, {
            id: "travis-repo-id",
          })
          .put("/hooks", {
            hook: {
              id: "travis-repo-id",
              active: true,
            },
          })
          .reply(204)
      })

      beforeEach("call configure", function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate: false,
        }
        return this.sut.configure(options)
      })

      it("should call of the travis endpoints", function() {
        this.travisOrg.done()
        this.travisOrgAuthed.done()
      })
    })

    describe("when the repo is private", function() {
      beforeEach("setup travis endpoint", function() {
        this.travisComAuthed
          .get("/repos/some-owner/example-repo-name")
          .reply(200, {
            id: "travis-repo-id",
          })
          .put("/hooks", {
            hook: {
              id: "travis-repo-id",
              active: true,
            },
          })
          .reply(204)
      })

      beforeEach("call configure", function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate: true,
        }
        return this.sut.configure(options)
      })

      it("should call of the travis endpoints", function() {
        this.travisCom.done()
        this.travisComAuthed.done()
      })
    })

    describe("when travis is ratelimited", function() {
      beforeEach("setup travis endpoints", function() {
        this.travisOrgAuthed.get("/repos/some-owner/example-repo-name").reply(403)
      })

      it("should be rejected", function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate: false,
        }
        expect(this.sut.configure(options)).to.be.rejected
      })
    })
  })
})

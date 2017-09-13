const { beforeEach, describe, sinon, it, expect } = global
const path = require("path")
const GitService = require("../../../lib/services/git-service")

describe("Git: release new version", function() {
  beforeEach("setup git mock", function() {
    this.gitMock = {
      branch: sinon.stub(),
      tags: sinon.stub(),
      add: sinon.stub(),
      commit: sinon.stub(),
      tag: sinon.stub(),
      push: sinon.stub(),
      pushTags: sinon.stub(),
      customBinary: sinon.spy(),
    }
  })

  beforeEach("create service", function() {
    this.sut = new GitService({
      project: {
        root: path.join("/tmp", "test-beekeeper-project"),
      },
      gitMock: this.gitMock,
    })
  })

  describe("when it fails", function() {
    describe("when not a git repo", function() {
      beforeEach("setup git methods", function() {
        this.gitMock.branch.rejects(new Error("fatal: Not a git repository (or any of the parent directories): .git"))
      })

      beforeEach("setup options", function() {
        this.options = {
          projectVersion: "v1.0.0",
          message: "no ragrets",
        }
      })

      it("should be rejected", function(done) {
        expect(this.sut.release(this.options))
          .to.be.rejectedWith("fatal: Not a git repository (or any of the parent directories): .git")
          .notify(done)
      })

      it("should call of the git methods", function() {
        return this.sut.release(this.options).catch(() => {
          expect(this.gitMock.branch).to.have.been.calledWith()
        })
      })
    })

    describe("when the current branch is not master", function() {
      beforeEach("setup git methods", function() {
        this.gitMock.branch.resolves({ current: "not-master" })
      })

      beforeEach("setup options", function() {
        this.options = {
          projectVersion: "v1.0.0",
          message: "no ragrets",
        }
      })

      it("should be rejected", function(done) {
        expect(this.sut.release(this.options))
          .to.be.rejectedWith("Current branch must be 'master'")
          .notify(done)
      })

      it("should call of the git methods", function() {
        return this.sut.release(this.options).catch(() => {
          expect(this.gitMock.branch).to.have.been.calledWith()
        })
      })
    })

    describe("when the tag already exists", function() {
      beforeEach("setup git methods", function() {
        this.gitMock.branch.resolves({ current: "master" })
        this.gitMock.tags.resolves({ all: ["v1.0.0"] })
      })

      beforeEach("setup options", function() {
        this.options = {
          projectVersion: "v1.0.0",
          message: "no ragrets",
        }
      })

      it("should be rejected", function(done) {
        expect(this.sut.release(this.options))
          .to.be.rejectedWith("Tag v1.0.0 already exists")
          .notify(done)
      })

      it("should call of the git methods", function() {
        return this.sut.release(this.options).catch(() => {
          expect(this.gitMock.branch).to.have.been.calledWith()
          expect(this.gitMock.tags).to.have.been.calledWith()
        })
      })
    })
    describe("when the tag is not valid semver", function() {
      beforeEach("setup git methods", function() {
        this.gitMock.branch.resolves({ current: "master" })
        this.gitMock.tags.resolves({ all: ["v1.0.0"] })
      })

      beforeEach("setup options", function() {
        this.options = {
          projectVersion: "not-valid-semver",
          message: "no ragrets",
        }
      })

      it("should be rejected", function(done) {
        expect(this.sut.release(this.options))
          .to.be.rejectedWith("Version 'not-valid-semver' must be valid semver")
          .notify(done)
      })
    })
  })

  describe("when it succeeds", function() {
    beforeEach("setup git methods", function() {
      this.gitMock.branch.resolves({
        current: "master",
      })
      this.gitMock.tags.resolves({ all: [] })
      this.gitMock.add.resolves()
      this.gitMock.commit.resolves()
      this.gitMock.tag.resolves()
    })

    beforeEach("call release", function() {
      const options = {
        projectVersion: "v1.0.0",
        message: "no ragrets",
      }
      return this.sut.release(options)
    })

    it("should call of the git methods", function() {
      expect(this.gitMock.branch).to.have.been.calledWith()
      expect(this.gitMock.tags).to.have.been.calledWith()
      expect(this.gitMock.add).to.have.been.calledWith(path.join("/tmp", "test-beekeeper-project", "*"))
      expect(this.gitMock.commit).to.have.been.calledWith("no ragrets")
      expect(this.gitMock.tag).to.have.been.calledWith(["v1.0.0"])
      expect(this.gitMock.push).to.have.been.calledWith()
      expect(this.gitMock.pushTags).to.have.been.calledWith()
    })
  })
})

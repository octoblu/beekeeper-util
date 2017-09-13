const { describe, it, expect, context } = global
const path = require("path")
const ProjectHelper = require("../../lib/helpers/project-helper")

describe("Project Helper", function() {
  context("when in a node project", function() {
    beforeEach("init projectHelper", function() {
      this.projectHelper = new ProjectHelper({ projectRoot: path.join(__dirname, "../examples/node-project") })
    })

    it("should get the project name", function() {
      const projectName = this.projectHelper.defaultProjectName()
      expect(projectName).to.equal("test-beekeeper")
    })

    it("should get the project version", function() {
      const projectVersion = this.projectHelper.projectVersion()
      expect(projectVersion).to.equal("1.0.0")
    })
  })

  context("when in a node project with a namespace", function() {
    beforeEach("init projectHelper", function() {
      this.projectHelper = new ProjectHelper({ projectRoot: path.join(__dirname, "../examples/node-project-with-namespace") })
    })

    it("should get the project name", function() {
      const projectName = this.projectHelper.defaultProjectName()
      expect(projectName).to.equal("namespaced-project")
    })

    it("should get the project version", function() {
      const projectVersion = this.projectHelper.projectVersion()
      expect(projectVersion).to.equal("2.0.0")
    })
  })

  context("when in a go project without a version.go", function() {
    beforeEach("init projectHelper", function() {
      this.projectHelper = new ProjectHelper({ projectRoot: path.join(__dirname, "../examples/go-project") })
    })

    it("should get the project name", function() {
      const projectName = this.projectHelper.defaultProjectName()
      expect(projectName).to.equal("go-project")
    })

    it("should get the project version", function() {
      const projectVersion = this.projectHelper.projectVersion()
      expect(projectVersion).to.equal("3.0.0")
    })
  })

  context("when in a go project with a version.go", function() {
    beforeEach("init projectHelper", function() {
      this.projectHelper = new ProjectHelper({ projectRoot: path.join(__dirname, "../examples/go-project-with-version-go") })
    })

    it("should get the project name", function() {
      const projectName = this.projectHelper.defaultProjectName()
      expect(projectName).to.equal("go-project-with-version-go")
    })

    it("should get the project version", function() {
      const projectVersion = this.projectHelper.projectVersion()
      expect(projectVersion).to.equal("4.0.0")
    })
  })

  context("when in a generic project", function() {
    beforeEach("init projectHelper", function() {
      this.projectHelper = new ProjectHelper({ projectRoot: path.join(__dirname, "../examples/generic-project") })
    })

    it("should get the project name", function() {
      const projectName = this.projectHelper.defaultProjectName()
      expect(projectName).to.equal("generic-project")
    })

    it("should get the project version", function() {
      const projectVersion = this.projectHelper.projectVersion()
      expect(projectVersion).to.equal("5.0.0")
    })
  })

  context("when in an empty project", function() {
    beforeEach("init projectHelper", function() {
      this.projectHelper = new ProjectHelper({ projectRoot: path.join(__dirname, "../examples/empty-project") })
    })

    it("should get the project name", function() {
      const projectName = this.projectHelper.defaultProjectName()
      expect(projectName).to.equal("empty-project")
    })

    it("should throw an error", function() {
      expect(() => {
        this.projectHelper.projectVersion()
      }).to.throw("Project must contain a version file")
    })
  })
})

const bindAll = require("lodash/fp/bindAll")
const path = require("path")
const fs = require("fs-extra")
const get = require("lodash/fp/get")
const set = require("lodash/set")
const replace = require("lodash/replace")
const semver = require("semver")
const semverRegex = require("semver-regex")
const last = require("lodash/last")
const first = require("lodash/first")
const split = require("lodash/fp/split")
const pipe = require("lodash/fp/pipe")
const findVersions = require("find-versions")

class ProjectHelper {
  constructor({ projectRoot }) {
    bindAll(Object.getOwnPropertyNames(ProjectHelper.prototype), this)
    this.projectRoot = projectRoot
    this.language = this._detectProjectLanguage()
  }

  defaultProjectName() {
    if (this.language === "node") return this._parsePackageName()
    return path.basename(this.projectRoot)
  }

  hasDockerfile() {
    return this._hasFileAccess("Dockerfile")
  }

  projectVersionFile() {
    let versionFilePath
    if (this.language === "node") return path.join(this.projectRoot, "package.json")
    if (this._hasFileAccess("version.go")) {
      versionFilePath = path.join(this.projectRoot, "version.go")
    } else {
      if (!this._hasFileAccess("VERSION")) {
        throw new Error("Project must contain a version file")
      }
      versionFilePath = path.join(this.projectRoot, "VERSION")
    }
    return versionFilePath
  }

  projectVersion() {
    if (this.language === "node") return this._parsePackageVersion()
    const versionFilePath = this.projectVersionFile()
    const contents = fs.readFileSync(versionFilePath, "utf8")
    return first(findVersions(contents))
  }

  incrementVersion({ projectVersion, prerelease, release }) {
    if (release === "init") return "1.0.0"
    return semver.inc(projectVersion, release, prerelease)
  }

  modifyVersionFile({ tag }) {
    let newContents
    const version = semver.clean(tag)
    const versionFile = this.projectVersionFile()
    const contents = fs.readFileSync(versionFile, "utf8")
    try {
      const jsonContents = JSON.parse(contents)
      set(jsonContents, "version", version)
      newContents = JSON.stringify(jsonContents, null, 2)
    } catch (e) {
      newContents = replace(contents, semverRegex(), version)
    }
    fs.writeFileSync(versionFile, newContents)
  }

  _detectProjectLanguage() {
    if (this._hasFileAccess("package.json")) return "node"
    if (this._hasFileAccess("main.go")) return "golang"
  }

  _parsePackageName() {
    const filePath = path.join(this.projectRoot, "package.json")
    const contents = fs.readJsonSync(filePath)
    const removeNamespace = pipe(get("name"), split("/"), last)
    return removeNamespace(contents)
  }

  _parsePackageVersion() {
    const filePath = path.join(this.projectRoot, "package.json")
    const contents = fs.readJsonSync(filePath)
    return get("version", contents) || "0.0.0"
  }

  _hasFileAccess(filePath) {
    try {
      fs.accessSync(path.join(this.projectRoot, filePath), fs.constants.F_OK | fs.constants.R_OK)
    } catch (e) {
      return false
    }
    return true
  }
}
module.exports = ProjectHelper

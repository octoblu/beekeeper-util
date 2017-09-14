_      = require 'lodash'
path   = require 'path'
url    = require 'url'
yaml   = require 'node-yaml'
fs     = require 'fs-extra'
semver = require 'semver'
semverRegex = require 'semver-regex'
debug  = require('debug')('beekeeper-util:project-service')

class ProjectService
  constructor: ({ @projectRoot, @projectVersionFile, @spinner }) ->
    throw new Error 'Missing projectRoot in config' unless @projectRoot?
    throw new Error 'Missing projectVersionFile in config' unless @projectVersionFile?
    @packagePath = path.join @projectRoot, 'package.json'
    @versionFile = @projectVersionFile

  modifyVersion: ({ tag }, callback) =>
    version = semver.clean(tag)
    debug 'modifyVersion', { tag, version }
    @spinner?.start "Project: Setting version v#{tag}"
    fs.readFile @versionFile, 'utf8', (error, contents) =>
      return callback error if error?
      try
        jsonContents = JSON.parse contents
        _.set jsonContents, 'version', version
        newContents = JSON.stringify jsonContents, null, 2
      catch
        newContents = _.replace contents, semverRegex(), version
      fs.writeFile @versionFile, newContents, callback

module.exports = ProjectService

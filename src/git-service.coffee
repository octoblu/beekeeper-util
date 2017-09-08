{ check, isGit } = require 'git-state'
simpleGit        = require 'simple-git'
semver           = require 'semver'
path             = require 'path'
debug            = require('debug')('beekeeper-util:git-service')
which            = require 'which'

class GitService
  constructor: ({ config }) ->
    throw new Error "GitService missing config argument" unless config?
    { @project } = config
    throw new Error "GitService requires project in config" unless @project.root?

  check: ({ tag }, callback) =>
    isGit @project.root, (isGitRepo) =>
      return callback new Error('Must be a git repo') unless isGitRepo
      check @project.root, (error, result) =>
        return callback error if error?
        { branch } = result
        return callback new Error 'Branch must be master' unless branch == 'master'
        @_validateTag { tag }, callback

  release: ({ message, tag }, callback) =>
    git = @_git()
    git.add path.join(@project.root, '*')
    git.commit message, (error) =>
      return callback error if error?
      @_tagAndPush git, tag, callback

  pull: (callback) =>
    git = @_git()
    git.push callback

  _isOutdated: (callback) =>
    git = @_git()
    git.fetch (error) =>
      return callback error if error?
      git.log callback

  _tagAndPush: (git, tag, callback) =>
    git.tag ["v#{tag}"], (error) =>
      return callback error if error?
      git.push (error) =>
        return callback error if error?
        git.pushTags callback

  _git: () =>
    git = simpleGit @project.root
    gitTogether = which.sync('git-together', {nothrow: true})
    git.customBinary(gitTogether) if gitTogether?
    return git

  _validateTag: ({ tag }, callback) =>
    return callback new Error "Invalid tag v#{tag}" unless semver.valid tag
    @_git().tags (error, tags) =>
      return callback error if error?
      debug 'found tags', tags
      return callback new Error "Tag #{tag} already exists" if "v#{tag}" in tags.all
      callback null

module.exports = GitService

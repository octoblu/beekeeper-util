{ check, isGit } = require 'git-state'
simpleGit        = require 'simple-git'
_                = require 'lodash'
semver           = require 'semver'
path             = require 'path'
debug            = require('debug')('beekeeper-util:git-service')

class GitService
  constructor: ({ config }) ->
    throw new Error "GitService missing config argument" unless config?
    { @projectRoot } = config
    throw new Error "GitService requires projectRoot in config" unless @projectRoot?

  check: ({ tag }, callback) =>
    isGit @projectRoot, (isGitRepo) =>
      return callback new Error('Must be a git repo') unless isGitRepo
      check @projectRoot, (error, result) =>
        return callback error if error?
        { branch } = result
        return callback new Error 'Branch must be master' unless branch == 'master'
        @_validateTag { tag }, callback

  release: ({ authors, message, tag }, callback) =>
    git = @_git()
    @_setAuthors git, authors
    git.add path.join(@projectRoot, '*')
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

  _setAuthors: (git, authors) =>
    return if _.isEmpty authors
    names = _.join _.map(authors, 'name'), ', '
    emails = _.join _.map(authors, 'email'), ', '
    debug('authors', { names, emails })
    git.addConfig 'user.name', names
    git.addConfig 'user.email', emails

  _tagAndPush: (git, tag, callback) =>
    git.tag ["v#{tag}"], (error) =>
      return callback error if error?
      git.push (error) =>
        return callback error if error?
        git.pushTags callback

  _git: () => simpleGit @projectRoot

  _validateTag: ({ tag }, callback) =>
    return callback new Error "Invalid tag v#{tag}" unless semver.valid tag
    @_git().tags (error, tags) =>
      return callback error if error?
      debug 'found tags', tags
      return callback new Error "Tag #{tag} already exists" if "v#{tag}" in tags.all
      callback null

module.exports = GitService

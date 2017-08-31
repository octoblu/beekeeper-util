{ check, isGit }  = require 'git-state'
simpleGit = require 'simple-git'

class GitService
  constructor: ({ config }) ->
    throw new Error "GitService missing config argument" unless config?
    { @projectRoot } = config
    throw new Error "GitService requires projectRoot in config" unless @projectRoot?

  check: (callback) =>
    isGit @projectRoot, (isGitRepo) =>
      return callback new Error('Must be a git repo') unless isGitRepo
        check @projectRoot, (error, result) =>
          return callback error if error?
          { branch } = result
          unless branch == 'master'
            return callback new Error 'Branch must be master'

  commit: ({ authors }, callback) =>
    git = simpleGit @projectRoot
    git.addConfig('user.name', 'Some One')
    git.addConfig('user.email', 'some@one.com')
    callback

  pull: (callback) =>
    git = simpleGit @projectRoot
    git.push callback

  _isOutdated: (callback) =>
    git = simpleGit @projectRoot
    git.fetch (error) =>
      return callback error if error?
      git.log callback

module.exports = GitService

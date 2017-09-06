_       = require 'lodash'
colors  = require 'colors'
program = require 'commander'
semver  = require 'semver'
async   = require 'async'

GithubService    = require './src/github-service.coffee'
GitService       = require './src/git-service.coffee'
BeekeeperService = require './src/beekeeper-service.coffee'
ProjectService   = require './src/project-service.coffee'

packageJSON   = require './package.json'

list = (val) -> _.map _.split(val, ','), _.trim

program
  .version packageJSON.version
  .usage '[options] <message>'
  .option '-r, --repo <repo-name>', 'Project repo name'
  .option '-o, --owner <octoblu>', 'Project owner'
  .option '-t, --tag <tag>', 'Override project version'
  .option '--init', 'Set version 1.0.0'
  .option '--major', 'Bump with semver major version'
  .option '--premajor', 'Bump with semver premajor version'
  .option '--minor', 'Bump with semver minor version'
  .option '--preminor', 'Bump with semver preminor version'
  .option '--patch', 'Bump with semver patch version. Default version release.'
  .option '--prepatch', 'Bump with semver prepatch version'
  .option '--prerelease [preid]', 'Bump with semver prerelease version, value is <tag>-<preid>'
  .option '-a, --authors <authors>', 'a list of authors', list

class Command
  constructor: (@config) ->
    process.on 'uncaughtException', @die
    @githubService = new GithubService { @config }
    @gitService = new GitService { @config }
    @beekeeperService = new BeekeeperService { @config }
    @projectService = new ProjectService { @config }

  parseOptions: =>
    program.parse process.argv
    message = program.args[0]
    repo = program.repo || @config.name
    owner = program.owner || @config.owner
    authors = _.map program.authors, (initial) => @config.authors[initial]
    tag = @getNewTag program
    return {
      repo,
      owner,
      tag,
      authors,
      message,
    }

  getNewTag: (program) =>
    return semver.valid program.tag if semver.valid program.tag
    tag = @config.version
    release = @getRelease program
    return '1.0.0' if release == 'init'
    preid = program.prerelease
    return semver.inc(tag, release, preid)

  getRelease: (program) =>
    return 'init' if program['init']
    return 'major' if program['major']
    return 'premajor' if program['premajor']
    return 'minor' if program['minor']
    return 'preminor' if program['preminor']
    return 'patch' if program['patch']
    return 'prepatch' if program['prepatch']
    return 'prerelease' if program['prerelease']
    return 'patch'

  run: =>
    { authors, message, tag, owner, repo } = @parseOptions()
    async.series [
      async.apply @gitService.check, { tag }
      async.apply @projectService.initVersionFile
      async.apply @projectService.modifyVersion, { tag }
      async.apply @gitService.release, { authors, message, tag }
      async.apply @beekeeperService.create, { owner, repo, tag }
    ], (error) =>
      return @die error if error?
      console.log colors.green("RELEASED"), colors.bold("v#{tag}")
      @die()

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.toString(), error.stack
    process.exit 1

module.exports = Command

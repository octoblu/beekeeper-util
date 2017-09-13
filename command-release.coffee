_       = require 'lodash'
program = require 'commander'
semver  = require 'semver'
async   = require 'async'
Spinner = require './src/spinner'

GithubService    = require './lib/services/github-service'
GitService       = require './src/git-service'
BeekeeperService = require './src/beekeeper-service'
ProjectService   = require './src/project-service'

packageJSON   = require './package.json'

program
  .version packageJSON.version
  .usage '[options] <message>'
  .option '-r, --repo <repo-name>', 'Project repo name'
  .option '-o, --owner <repo>', 'Project owner'
  .option '-t, --tag <tag>', 'Override project version'
  .option '--init', 'Set version 1.0.0'
  .option '--major', 'Bump with semver major version'
  .option '--premajor', 'Bump with semver premajor version'
  .option '--minor', 'Bump with semver minor version'
  .option '--preminor', 'Bump with semver preminor version'
  .option '--patch', 'Bump with semver patch version. Default version release.'
  .option '--prepatch', 'Bump with semver prepatch version'
  .option '--prerelease [preid]', 'Bump with semver prerelease version, value is <tag>-<preid>'

class Command
  constructor: (@config) ->
    @spinner = new Spinner()
    @spinner.start("Starting Beekeeper")
    process.on 'uncaughtException', @die
    { github } = @config
    @githubService = new GithubService { github, @spinner }
    @gitService = new GitService { @config, @spinner }
    @beekeeperService = new BeekeeperService { @config, @spinner }
    @projectService = new ProjectService { @config, @spinner }

  parseOptions: =>
    program.parse process.argv
    repo = program.repo || @config.project.name
    owner = program.owner || @config.project.owner
    tag = @getNewTag program
    release = @getRelease program
    message = _.trim "v#{tag} #{program.args[0] || ''}"
    return {
      repo,
      owner,
      tag,
      message,
      release
    }

  getNewTag: (program) =>
    return semver.valid program.tag if semver.valid program.tag
    tag = @config.project.version
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
    { message, tag, owner, repo, release } = @parseOptions()
    projectName = repo
    projectOwner = owner
    
    @spinner.log("Releasing v#{tag} (#{release})", '🐝')
    @spinner.start("Beekeeping")
    async.series [
      async.apply @gitService.check, { tag }
      async.apply @projectService.initVersionFile
      async.apply @projectService.modifyVersion, { tag }
      async.apply @gitService.release, { message, tag }
      async.apply @beekeeperService.create, { owner, repo, tag }
    ], (error) =>
      return @die error if error?
      @githubService.createRelease { projectOwner, projectName, tag, message, release }
        .then =>
          @spinner.succeed("Shipped it!")
          @die()
        .catch @die

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    @spinner.warn()
    @spinner.fail error.toString()
    console.error error.stack
    process.exit 1

module.exports = Command

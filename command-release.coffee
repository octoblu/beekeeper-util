_       = require 'lodash'
program = require 'commander'
semver  = require 'semver'
async   = require 'async'
ora     = require 'ora'
chalk   = require 'chalk'

GithubService    = require './src/github-service.coffee'
GitService       = require './src/git-service.coffee'
BeekeeperService = require './src/beekeeper-service.coffee'
ProjectService   = require './src/project-service.coffee'

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
    process.on 'uncaughtException', @die
    @githubService = new GithubService { @config }
    @gitService = new GitService { @config }
    @beekeeperService = new BeekeeperService { @config }
    @projectService = new ProjectService { @config }

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
    spinner = ora()
    spinner.start("Releasing v#{tag}")
    async.series [
      async.apply @gitService.check, { tag }
      async.apply @projectService.initVersionFile
      async.apply @startSpinner, { spinner, text: "Modifying version to v#{tag}" }
      async.apply @projectService.modifyVersion, { tag }
      async.apply @stopAndPersistSpinner, { spinner }
      async.apply @startSpinner, { spinner, text: "Creating git release for v#{tag}" }
      async.apply @gitService.release, { message, tag }
      async.apply @stopAndPersistSpinner, { spinner }
      async.apply @startSpinner, { spinner, text: "Creating beekeeper release for v#{tag}", enabled: @config.beekeeper.enabled }
      async.apply @beekeeperService.create, { owner, repo, tag }
      async.apply @stopAndPersistSpinner, { spinner }
      async.apply @startSpinner, { spinner, text: "Creating github release for v#{tag}", enabled: @config.github.release.enabled }
      async.apply @githubService.createRelease, { owner, repo, tag, message, release }
      async.apply @stopAndPersistSpinner, { spinner }
    ], (error) =>
      if error?
        spinner.fail(error.toString())
      else
        spinner.succeed("Released v#{tag}")
      @die()

  startSpinner: ({ spinner, text, color, enabled }, callback) =>
    return callback(null) unless enabled
    spinner.color = color if color?
    spinner.start(text)
    callback null

  stopAndPersistSpinner: ({ spinner }, callback) =>
    spinner.stopAndPersist({ symbol: chalk.cyan('✔') })
    callback()

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.toString(), error.stack
    process.exit 1

module.exports = Command

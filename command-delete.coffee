colors      = require 'colors'
program     = require 'commander'
semver      = require 'semver'
packageJSON = require './package.json'

BeekeeperService = require './lib/services/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-t, --tag <tag>', 'Project version'
  .option '-o, --owner <repo>', 'Project owner'

class Command
  constructor: (@config) ->
    process.on 'uncaughtException', @die
    { beekeeper } = @config
    @beekeeperService = new BeekeeperService { beekeeper }

  parseOptions: =>
    program.parse process.argv
    repo = program.args[0] || @config.project.name
    owner = program.owner || @config.project.owner
    tag = semver.valid(program.tag) || @config.project.version

    @dieHelp new Error 'Missing repo' unless repo?
    @dieHelp new Error 'Missing tag' unless tag?

    return { repo, owner, tag }

  run: =>
    {repo, owner, tag} = @parseOptions()
    projectOwner = owner
    projectName = repo
    projectVersion = tag
    return @die new Error('Beekeeper must be enabled') unless @config.beekeeper.enabled
    @beekeeperService.delete { projectOwner, projectName, projectVersion }
      .then =>
        console.log colors.bold("[DELETED]"), "tag #{tag}"
        @die()
      .catch @die

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command

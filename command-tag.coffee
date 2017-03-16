program     = require 'commander'
packageJSON = require './package.json'

Config           = require './src/config'
BeekeeperService = require './src/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <tag>'
  .option '-r, --repo <repo-name>', 'Project repo name. Defaults to package.name'
  .option '-t, --tag <tag>', 'Project version (not the tag on the deployment). Defaults to package.version'
  .option '-o, --owner <octoblu>', 'Project owner'

class Command
  constructor: ->
    process.on 'uncaughtException', @die
    @config = new Config()
    @beekeeperService = new BeekeeperService { config: @config.get() }

  parseOptions: =>
    program.parse process.argv
    tagName = program.args[0]

    { owner, tag, repo } = program
    repo = @config.getName(repo)
    owner ?= 'octoblu'
    tag = @config.getVersion(tag)

    @dieHelp new Error 'Missing tag argument' unless tagName?
    @dieHelp new Error 'Must specify a repo' unless repo?
    @dieHelp new Error 'Must specify a version to deploy (-t,--tag)' unless tag?

    return { repo, owner, tag, tagName }

  run: =>
    {repo, owner, tag, tagName } = @parseOptions()
    @beekeeperService.tagDeployment { repo, owner, tag, tagName }, (error) =>
      return @die error if error?
      process.exit 0

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command

program     = require 'commander'
Confirm     = require 'prompt-confirm'
colors      = require 'colors/safe'
semver      = require 'semver'
packageJSON = require './package.json'

BeekeeperService = require './src/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <tag>'
  .option '-r, --repo <repo-name>', 'Project repo name. Defaults to package.name'
  .option '-t, --tag <tag>', 'Project version (not the tag on the deployment). Defaults to package.version'
  .option '-o, --owner <octoblu>', 'Project owner'
  .option '--prompt', 'Prompt before tagging. Defaults to false'

class Command
  constructor: (@config) ->
    process.on 'uncaughtException', @die
    @beekeeperService = new BeekeeperService { @config }

  parseOptions: =>
    program.parse process.argv
    tagName = program.args[0]

    { prompt } = program
    repo = program.repo || @config.name
    owner = program.owner || @config.owner
    tag = semver.clean(program.tag) || @config.version

    @dieHelp new Error 'Missing tag argument' unless tagName?
    @dieHelp new Error 'Must specify a repo' unless repo?
    @dieHelp new Error 'Must specify a version to deploy (-t,--tag)' unless tag?

    return { repo, owner, tag, tagName, prompt }

  run: =>
    { repo, owner, tag, tagName, @prompt } = @parseOptions()
    @beekeeperService.getTag { repo, owner, tag }, (error, deployment) =>
      return @die error if error?
      return @printDeploymentMissing({ tag }) unless deployment?
      @beekeeperService.getTag { repo, owner, tag: 'latest', filter: tagName }, (error, taggedDeployment) =>
        return @die error if error?
        return @printAlreadyExists({ tagName, tag }) if taggedDeployment?.tag == tag
        @warnBeforeTag { taggedDeployment, tag, tagName, repo }, (error) =>
          return @die error if error?
          @beekeeperService.tagDeployment { repo, owner, tag, tagName }, (error) =>
            return @die error if error?
            @printSuccess({ tagName, tag })

  printAlreadyExists: ({ tagName, tag }) =>
    bold = (str) => colors.bold colors.white str
    console.log "Tag #{bold tagName} already exists on version #{bold tag}"
    process.exit(0)

  printSuccess: ({ tag, tagName })=>
    console.log("Tagged #{tag} with #{tagName}")
    process.exit(0)

  printDeploymentMissing: ({ tag })=>
    console.log("Deployment for #{tag} is missing")
    process.exit(1)

  printUnwilling: =>
    console.log colors.red "Cowardly refusing to do anything."
    process.exit(1)

  warnBeforeTag: ({ repo, tag, taggedDeployment, tagName }, callback) =>
    console.log(colors.cyan('[ IMPORTANT ]'))
    bold = (str) => colors.bold colors.white str
    warn = (str) => console.log str
    if taggedDeployment?
      warn "The current version tagged with #{bold(tagName)} is #{bold(taggedDeployment.tag)}"
    else
      warn "#{bold(repo)} has never been tagged with #{bold(tagName)}"
    console.log ''
    @confirm "Did you test it?", =>
      @confirm "Are you sure '#{tagName}' is ready?", =>
        console.log bold "Tagging version #{tag} with #{tagName}"
        callback()

  confirm: (message, callback) =>
    return callback() unless @prompt
    new Confirm({ message, default: false }).ask (answer) =>
      return @printUnwilling() unless answer
      callback()

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command

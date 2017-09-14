const clone = require("lodash/clone")
const fs = require("fs-extra")
const defaults = require("lodash/defaults")
const { parse } = require("dotenv")

const parseEnvFile = function(envFile) {
  let contents
  try {
    contents = fs.readFileSync(envFile)
  } catch (error) {
    return []
  }
  return parse(contents)
}

module.exports = ({ env, filePath }) => {
  const defaultEnv = clone(env)
  const parsedEnv = parseEnvFile(filePath)
  return defaults(defaultEnv, parsedEnv)
}

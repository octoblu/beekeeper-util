const semver = require("semver")
const getVersion = str => {
  if (!str) return
  const version = semver.valid(str)
  if (!version) return
  return version
}

const getTag = str => {
  const version = getVersion(str)
  if (!version) return
  return `v${version}`
}

module.exports = {
  getVersion,
  getTag,
}

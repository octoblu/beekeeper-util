require('coffee-script/register')

const GenerateDockerToken = require('./src/generate-docker-token')

const username = process.env.DOCKER_HUB_USERNAME
const password = process.env.DOCKER_HUB_PASSWORD
new GenerateDockerToken({ username, password }).generate()

const { beforeEach, describe, it, sinon, expect } = global
const DockerHubService = require("../../../lib/services/docker-hub-service")
const each = require("lodash/each")
const uuid = require("uuid")
const privates = [true, false]

describe("DockerHub: Configure a new project", function() {
  each(privates, function(isPrivate) {
    describe(`isPrivate: ${isPrivate}`, function() {
      beforeEach("setup docker hub mocks", function() {
        this.mockDockerHubApi = {
          login: sinon.stub(),
          createRepository: sinon.stub(),
          deleteBuildTag: sinon.stub(),
          repository: sinon.stub(),
          buildSettings: sinon.stub(),
          makeDeleteRequest: sinon.stub(),
          createWebhook: sinon.stub(),
          createWebhookHook: sinon.stub(),
        }
      })

      beforeEach("create service", function() {
        this.sut = new DockerHubService({
          dockerHub: {
            enabled: true,
            username: "some-docker-hub-username",
            password: "some-docker-hub-password",
          },
          beekeeper: {
            enabled: true,
            uri: "https://bk-user:bk-password@beekeeper.example.com",
          },
          mockDockerHubApi: this.mockDockerHubApi,
        })
      })

      beforeEach("setup docker hub api endpoints", function() {
        this.mockDockerHubApi.login.resolves({ token: uuid.v1() })
        this.mockDockerHubApi.repository.resolves()
        this.mockDockerHubApi.createRepository.resolves()
        this.mockDockerHubApi.createWebhook.resolves({ id: "some-webhook-id" })
        this.mockDockerHubApi.createWebhookHook.resolves()
      })

      beforeEach("call configure", function() {
        const options = {
          projectName: "example-repo-name",
          projectOwner: "some-owner",
          isPrivate,
        }
        return this.sut.configure(options)
      })

      it("should call of the docker hub endpoints", function() {
        expect(this.mockDockerHubApi.login).to.have.been.calledWith(
          "some-docker-hub-username",
          "some-docker-hub-password",
        )
        expect(this.mockDockerHubApi.repository).to.have.been.calledWith("some-owner", "example-repo-name")
        expect(this.mockDockerHubApi.createRepository).to.have.been.calledWith("some-owner", "example-repo-name", {
          active: true,
          description: "docker registry for some-owner/example-repo-name",
          is_private: isPrivate,
          provider: "github",
          vcs_repo_name: "some-owner/example-repo-name",
        })
        expect(this.mockDockerHubApi.createWebhook).to.have.been.calledWith(
          "some-owner",
          "example-repo-name",
          "Beekeeper v2",
        )
        expect(this.mockDockerHubApi.createWebhookHook).to.have.been.calledWith(
          "some-owner",
          "example-repo-name",
          "some-webhook-id",
          "https://bk-user:bk-password@beekeeper.example.com/webhooks/docker:hub",
        )
      })
    })
  })
})

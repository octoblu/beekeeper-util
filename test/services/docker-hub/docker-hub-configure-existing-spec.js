const { beforeEach, describe, it, sinon, expect } = global
const DockerHubService = require("../../../lib/services/docker-hub-service")
const each = require("lodash/each")
const uuid = require("uuid")
const privates = [true, false]

describe("DockerHub: Configure an existing project", function() {
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
          dockerHubEnabled: true,
          dockerHubUsername: "some-docker-hub-username",
          dockerHubPassword: "some-docker-hub-password",
          beekeeperEnabled: true,
          beekeeperUri: "https://bk-user:bk-password@beekeeper.example.com",
          mockDockerHubApi: this.mockDockerHubApi,
        })
      })

      beforeEach("setup docker hub api endpoints", function() {
        this.mockDockerHubApi.login.resolves({ token: uuid.v1() })
        this.mockDockerHubApi.repository.resolves({ id: uuid.v1() })
        this.mockDockerHubApi.createRepository.resolves()
        this.mockDockerHubApi.buildSettings.resolves({
          build_tags: [
            {
              id: "some-build-tag-id",
              name: "{sourceref}",
              source_name: "/v.*/",
              source_type: "Tag",
              dockerfile_location: "/",
            },
          ],
        })
        this.mockDockerHubApi.createWebhook.resolves({ name: ["A hook with 'Beekeeper v2' name already exists"] })
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
        expect(this.mockDockerHubApi.login).to.have.been.calledWith("some-docker-hub-username", "some-docker-hub-password")
        expect(this.mockDockerHubApi.repository).to.have.been.calledWith("some-owner", "example-repo-name")
        expect(this.mockDockerHubApi.createRepository).to.have.been.calledWith("some-owner", "example-repo-name", {
          active: true,
          description: "docker registry for some-owner/example-repo-name",
          is_private: isPrivate,
          provider: "github",
          vcs_repo_name: "some-owner/example-repo-name",
        })
        expect(this.mockDockerHubApi.createWebhook).to.have.been.calledWith("some-owner", "example-repo-name", "Beekeeper v2")
        expect(this.mockDockerHubApi.deleteBuildTag).to.have.been.calledWith("some-owner", "example-repo-name", "some-build-tag-id")
      })
    })
  })
})

const chai      = require('chai')
const sinon     = require('sinon')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(sinonChai)
chai.use(chaiAsPromised)

global.expect = chai.expect
global.assert = chai.assert
global.sinon  = sinon

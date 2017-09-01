var should = require('should'); // DOC: https://shouldjs.github.io/

// Init base test with config parameters as applicable
// NOTE: null means that parameter is mandatory and must be provided from json profile or command line
var test = require('../../basetest')(
  {
    serverUrl: null,
    username: null,
    password: null,
    testEmail: 'some@email.com',
    testContext : {
      testPostfix: '_${getUniqueId}',
      testOrgName: 'API-TestOrg_${getUniqueId}',
      testOrgUser: 'testeruser-${getUniqueId}',
      staticOrgPass: 'somepassword'
    }
  })

var testConfig = test.testConfig
var testContext = test.testContext // Holding state between individual tests or across tests as applicable
var server = test.server
var helpers = test.helpers

// Define test scenarios/sections as a set of request-response supertests
describe("Log on to server: ",function(){

  it("should find the login UI page",function(done){

    server
      .get("/#/security/login") // TODO: Follow 301?
      .expect("Content-type",/html/)
      .expect(200)
      .end(function(err, res){
        res.status.should.equal(200); // TODO: Other checks?
        return helpers.doneOrError(done, err, res)
      });
  });
});

describe('Add test organization and user ', function() {

  it('should add test org with default user ', function(done) {

    helpers.info('Creating test organization:'+ testContext.testOrgName)

    server
      .post('/app/security/organizations')
      .auth(testConfig.username, testConfig.password) // NOTE: Only need to log in here for session to persist
      .set('X-RequestId', helpers.getRequestId())
      .send( {"organization":{"name": testContext.testOrgName,"email":testConfig.testEmail}}  ) // TODO: Add support for deleting or reusing old org?
      .expect(200) // NOTE: If error;  Cannot read property 'status' of undefined - check if url is valid
      .end( function (err, res) {

        testContext.orgId = parseInt(res.body.organizationId)
        testContext.orgAdmin = res.body.adminUsername

        return helpers.doneOrError(done, err, res)
      });
  });
});

describe('Add sub-org tester group with appropriate roles and test user', function() {

  it('should add tester group ', function(done) {

    server
      .post('/app/security/groups')
      .set('X-RequestId', helpers.getRequestId())
      .send( {"group":{"name": testConfig.testOrgGroup}}  )
      .expect(200)
      .end( function (err, res) {

        helpers.debug('Response-Text: ' + res.text);

        testContext.orgGroupId = parseInt(res.body.groupId)

        return helpers.doneOrError(done, err, res)
      });
  });

  it('should get group information with no role set', function(done) {

    server
      .get('/app/security/groups/{0}'.format(testContext.orgGroupId))
      .set('X-RequestId', helpers.getRequestId())
      .expect('Content-Type', /json/)
      .expect(200)
      .end( function (err, res) {

        helpers.debug('Response-Text: ' + res.text);

        testContext.orgJsonObject = res.body; // Should be i.e {"group":{"name":"tester1","roles":{"role":[]},"id":44,"organization":{"name":"API-TestOrg","id":34}}}

        return helpers.doneOrError(done, err, res)
      });
  });

  it('should add configured roles to group', function(done) {

    this.timeout(5000) // Increase default time due to large request

    // Setting default roles for api tests
    testContext.orgJsonObject.group.roles.role = testConfig.testGroupRoles;

    server
      .put('/app/security/groups/{0}'.format(testContext.orgGroupId))
      .set('X-RequestId', helpers.getRequestId())
      .send( testContext.orgJsonObject )
      .expect(200)
      .end( function (err, res) {

        helpers.debug('Response-Text: ' + res.text);

        testContext.testOrgId = res.body.groupId
        testContext.testOrgId.should.be.greaterThan(0, 'Security group was succesfully created: ' + testContext.testOrgId)

        return helpers.doneOrError(done, err, res)
      });
  });

});


var should = require('should'); // DOC: https://shouldjs.github.io/

// Init base test with config parameters as applicable
// NOTE: null means that parameter is mandatory and must be provided from json profile or command line
var test = require('../../basetest')(
  {
    serverUrl: null,
    testContext : {
      testProduct: 'Product_',
      testProductAlias: 'P_',
      testOrgUser: 'tester',
      staticOrgPass: 'somepassword',
    }
  })

var testConfig = test.testConfig
var testContext = test.testContext // Holding state between individual tests or across tests as applicable
var server = test.server
var helpers = test.helpers

// Define test scenarios/sections as a set of request-response supertests
describe('Add product and alias ', function() {

  it('should create a product with an alias ', function(done) {
 
  server
      .post('/app/manage/products')
      .auth(testContext.testOrgUser, testContext.staticOrgPass) // NOTE: Only need to log in here for session to persist
      .set('X-RequestId', helpers.getRequestId())
      .send( {"product":{"name":  testContext.testProduct, "alias": testContext.testProductAlias}}  )
      .expect(200) // NOTE: If error;  Cannot read property 'status' of undefined - check if url is valid
      .end( function (err, res) {

        res.body.productId.should.be.greaterThan(0, 'A valid product needs to have been created: ' +res.body.productid)

        return helpers.doneOrError(done, err, res)
      });
  });

  it('should ensure that product is available in list afterwards', function(done) {

    server
      .get('/app/manage/products')
      .set('X-RequestId', helpers.getRequestId())
      .expect('Content-Type', /json/)
      .expect(200)
      .end( function (err, res) {

        res.body.content.find('name', testContext.testProduct).name.should.equal(testContext.testProduct,'Product {0} was created as expected'.format(testContext.testProduct))

        return helpers.doneOrError(done, err, res)
      });
  });
});

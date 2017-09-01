var supertest = require('supertest'); // DOC: http://visionmedia.github.io/superagent/
var superagent_defaults = require('superagent-defaults'); // DOC: https://github.com/camshaft/superagent-defaults
var helpers = require('./helpers'); // Locally defined helpers
// TODO : Add support for running:  mocha-parallel-tests ?
var AsyncLock = require('async-lock');

// Loading all process environment variables available
var processEnvSettingsDefaultName = 'SETTINGSITEM'; // Default value
var envDebugMode = (process.env.TESTDEBUG? (process.env.TESTDEBUG.toLowerCase()==='debugging') : false); // TODO: Create proper debug mode in script or use loglevel.trace?
var envContextInFile = (process.env.CONTEXTFILE? process.env.CONTEXTFILE : null);
var envContextFromId = (process.env.CONTEXTFROMID? process.env.CONTEXTFROMID : null);
var envLoglevel = (process.env.LOGLEVEL? process.env.LOGLEVEL : 'INFO'); // TODO: Use log levels logics for helpers.log ... etc also

// Setting up local variables
var testContextId = (envContextFromId!==null? envContextFromId : `testcontext-${process.pid}`)// Get from commandline or make a unique ID pr process running tests
var classLock = new AsyncLock(); // Add a class level ock
var testcontextKey = 'TESTCONTEXT'; // Constant: Name of testcontext names to share // TODO: ES6
var dynamicExprRegex = /\${(.*)}/
var initCount = 0
var lateloadConfigList = new Array(); // List of configurations to load
var packageTestContext = require('./TestContext')(testContextId); // Init test context class. Start as empty global for testrun/testpackage
var contextStorageFile = envContextInFile; // Use provided argument

var colors = require('mocha/lib/reporters/base').colors;
colors['pass'] = '32';
colors['slow'] = '34';

// Expose only a (static) constructure style function for loading config
module.exports = function(defaultJsonObject, processEnvName) {

  var self = new Object()
  self.helpers = helpers

  // Load any test config found in a file with an existing testcontext
  self.loadTestConfiguration = function(currentTestConfig, currentTestcontext) {

    // Then check for any testcontext in provided test file sub-key to link to testcontext or initialize with unique names
    for(var key in currentTestConfig) {
      if(key.toUpperCase()===testcontextKey) {
        var providedTestContextVars = currentTestConfig[key]
        for(var tcKey in providedTestContextVars) {
          // If the provided test context variable does not yet exist in shared testcontext, initialize it properly
          if(currentTestcontext[tcKey]===undefined || currentTestcontext[tcKey]===null) {
            var newTestcontextValue = providedTestContextVars[tcKey]
            // Check if any value present contains a custom helper dynamic expression which needs to be resolved
            var dynamicCapture = dynamicExprRegex.exec(newTestcontextValue)
            if(dynamicCapture!==null && dynamicCapture.length>1) {
              var dynamicFunction = dynamicCapture[1].toString()
              // If function exists apply it
              if(helpers.functions[dynamicFunction] !== undefined && typeof helpers.functions[dynamicFunction] === 'function') {
                var exprResult = helpers.functions[dynamicFunction].call(this, []); // Invoking helper method dynamically from in-test-helpers class/file
                newTestcontextValue = newTestcontextValue.replace(dynamicCapture[0].toString(), exprResult) // Replace whole expression found with result of dynamic call
                helpers.debug('Invoked "in-test-helpers.{0}" and applying result "{1}"'.format(dynamicFunction,exprResult))
              }
              else {
                throw new Error('Dynamic variable value expression found "'+dynamicFunction+'" but there does not exist a matching "in-test-helpers" class function. Please review code or expression.')
              }
            }
            if(newTestcontextValue!==undefined) {
              currentTestcontext[tcKey] = newTestcontextValue
              helpers.info('Added to textcontext "{0}":"{1}"'.format(tcKey,newTestcontextValue))
            }
            else {
              helpers.debug('Ignoring "{0}". Value is undefined.'.format(tcKey))
            }

          }
          // Test context key is already defined, so ignorning
          else {
            helpers.info('Ignoring "{0}". Already set in textcontext.'.format(tcKey))
          }
        }
      }
    }
  }

  // Base test init running synchronously
  self.syncInit = function() {

    // WORKAROUND Due to how mocha runner works; // If init has been done, just add test arguments to test context with default values
    if(initCount>0) {
      lateloadConfigList.push(defaultJsonObject);
    }
    else {
      // Default to sync loading of base test
      classLock.acquire('baseTestInit', function(doneLock) {
        self.init(doneLock)
      }, function(err, ret) { // lock released at this point

      }, {} ); // No options
    }
  }

  // Base test init method
  self.init = function(done) {
    var localCount = initCount++
    helpers.log('BaseTest init invoked:' + localCount)

    // Merge defaults below with configuration data loaded from json profile from command line (file or string) passed through environement variable
    // NOTE: null means that parameter is mandatory and must be provided from json profile or command line
    self.testConfig = require('./configloader')(defaultJsonObject, (processEnvName!==undefined? processEnvName : processEnvSettingsDefaultName))

    // If present, let command argument log level override
    if(envLoglevel!==null) { self.testConfig.logLevel=envLoglevel; }

    // Create a defaults test context
    if(self.testConfig.serverUrl===undefined) throw new Error('Supertest requires as target "serverUrl" to run. Please provide in config file or object')
    self.server = superagent_defaults(supertest.agent(self.testConfig.serverUrl))

    // Setup some defaults for superagent
    self.server.on('request', function (req) {

      helpers.info('Trying "'+req.method.toUpperCase()+'": ' + req.url)
      // Sanity check to avoid false positives during testing - check if the endpoint/action part of the url starts with the required / root slash
      if(req.url.charAt(req.app.length)!=='/') {
         throw new Error('Requested url seems to be invalid:"{0}". Please make sure the post/put/get url starts with a root slash (/) when writing tests with supertest.'.format(req.url));
      }

      // Check if request-body is present for any post/put
      req.on('end', function() {
        if((['POST','PUT'].indexOf(req.method.toUpperCase()) != -1) && (req._data===null || req._data===undefined || req._data.length==0)) {
          helpers.debug('Do note that POST body provided with this request is EMPTY. Is this expected behaviour?');
        }
      });

      // Debug all responses if at debug-log-level
      if(self.testConfig.logLevel && LOGLEVELS.fromString(self.testConfig.logLevel)>=LOGLEVELS.DEBUG) {
        req.on('response', function(res) {
          helpers.debug('Response-Text: ' + res.text);
          // Warn if empty response from server
          if(res.text===undefined || res.text.length==0) {
            helpers.warn('No content-data was provided in response to "{1}" request "{0}". Please check server side logs.'.format(req.url, req.method.toUpperCase()))
          }
        });
      }

    });

    self.testContext = packageTestContext; // Refer to global onerror
    self.helpers = helpers // Reference



    // Global set up - runs before all tests in test block/file
    before(function() {
      // If any, read and load test storage from file from this test session
      var storedObject = helpers.readJsonData(testContextId) // NOTE: If present this will re-use node-persist from run with provided id i.e testcontext-6240

      // If any context file specified, load it only if it already exists
      if(contextStorageFile!==null && helpers.existsJsonFile(contextStorageFile)) {
        helpers.log('Reading test context from file: "' + contextStorageFile + '" '+localCount)
        storedObject = helpers.readJsonFile(contextStorageFile)
      }
      helpers.log((testContextId!==undefined? 'Reading test context from storage' : 'Creating new test context') + ', ID:"'+testContextId + '" '+localCount)
      helpers.debug('Context retrieved contains the following data:', storedObject)
      self.testContext = (storedObject!==undefined? self.testContext.fromJsonObject(storedObject) : self.testContext)
      console.log('------------------')
      console.log(self.testContext)
      // Now parse and load any testconfig to find test context keys and values
      self.loadTestConfiguration(self.testConfig, self.testContext) // Updating objects by reference
    });

    // Global tear down - runs after all tests in test block/file
    after(function() {
      // Write current test context to file
      helpers.log('Writing test context to storage, ID:"' + testContextId + '" '+localCount)
      helpers.saveJsonData(testContextId, self.testContext.toJsonObject())

       // If any context file specified, save context to it
      if(contextStorageFile!==null) {
        helpers.log('Writing test context to file: "' + contextStorageFile + '" '+localCount)
        helpers.writeJsonFile(self.testContext.toJsonObject(), contextStorageFile)
      }
      done(); // Ending after the global after
    });

    // NOTE: Workaround for Mocha to allow for global before and after
    // TODO: Refactor to use programmtic setup?
    it('Basetest has loaded global setup and teardown. TestContext will be persisted.', function () {

      if(lateloadConfigList.length==0) {
        helpers.debug('Running file as STANDALONE test. No other testconfigurations or files found on path specified')
      } else {
        helpers.debug('Merging all {0} testconfigurations found in testpackage'.format(lateloadConfigList.length))
      }

      lateloadConfigList.forEach( function(anotherTestConfig) {
        self.loadTestConfiguration(anotherTestConfig, self.testContext) // Merge provided test config with current test context. Add if missing entry
      })
    });
  }

  self.syncInit() // Default to sync init
  return self // Return method instance as class
};

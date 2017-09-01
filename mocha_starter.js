#!/usr/bin/env node
var Mocha = require('mocha')
var fs = require('fs')
var path = require('path')
var helpers = require('./helpers')

var args = process.argv;
if(args.length<3) throw new Error('mocha_starter needs testfolder to be specified on startup. Usage ./mocha_starter.js pathToFolderWithTest')

var testFileOrDir = args[2]; // First is node, second is script, third is then first actual argument
var contextId = (process.env.CONTEXTFROMID===undefined? `testcontext-${process.pid}`: process.env.CONTEXTFROMID); // NOTE:  Not really needed for standalone test runner

// Setting up mocha
var mocha = new Mocha()

// Check if provided path is directory or path
if(fs.lstatSync(testFileOrDir).isDirectory()) {
  // Add each .js file to the mocha instance
  fs.readdirSync(testFileOrDir).filter(function(file) {
    // Only keep the .js files
    return file.endsWith('.js')
  }).forEach(function(file){
    mocha.addFile(
      path.join(testFileOrDir, file)
    )
  })
} // Otherwise just add single file
else {
  mocha.addFile(testFileOrDir)
}

// Run the tests using in-process mocha
var startMocha = function() {
  return new Promise( function(resolve, reject) {

    try {

      // When the whole process with mocha ends
      process.on('exit', function () {
        helpers.debug('MOCHA: Exiting...')
        var testcontext = helpers.readJsonData(contextId);
        return resolve(testcontext);
      })

      mocha.run(function(failures) {
        helpers.debug('MOCHA: Completed run')
        if(failures && failures>0) {
          helpers.warn('WARNING: ' + failures +' failing test(s) reported by Mocha runner. Please view DEBUG level logs')
        }
      })
      .on('fail', function(test, err) {
        helpers.debug('MOCHA: Failing test')
      })
      .on('end', function() {
        helpers.debug('MOCHA: All tests run')
      });

    }
    catch (mochaRunError) {
      return reject(mochaRunError)
    }

  })
}

startMocha().then( function(testcontext) {
   helpers.debug('MOCHA: Returned resulting TestContext, id:'+contextId+':'+(testcontext!==undefined))
   // TODO: Fix this using sub proc messaging?
   // WORKAROUND: Make a filename for passing the test context back via.
   var contextFilePath = path.join('.node-persist', process.env.CONTEXTFROMID.replace(' ','-')+'.json')
   helpers.debug('Writing TestContext to file (workaround): "' + contextFilePath+'"')
   helpers.writeJsonFile(testcontext, contextFilePath)
});

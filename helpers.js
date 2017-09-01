require('./extensions.js') // Load default objects extensions
var jsonfile = require('jsonfile') // DOC: https://www.npmjs.com/package/jsonfile
var storage = require('node-persist') // DOC: https://github.com/simonlast/node-persist
var testhelpers = require('./in-test-helpers') // Load the helpers classes for test usage
var fs = require('fs');

// Set up locals
storage.initSync() // Required for sync operations

// Define helper - utils function
var helpers = {

  // Map from helpers to in test helper functions
  functions : testhelpers,
  // Get a unqiue 16 digit/char UUID style string for use in requests
  getRequestId : function() {
    return testhelpers.getRequestId()
  },
  // Error handler for logging
  doneOrError : function(next, err, res) {
    if(err) {
      helpers.log(err)
      if(res) helpers.log(res.error)
    }
    return next(err?err:undefined)
  },
  // Write a json object file
  writeJsonFile : function(jsonObject, filePath) {
    try {
      jsonfile.writeFileSync(filePath, jsonObject)
      return true
    } catch(writeError) {
      helpers.error('ERROR: Could not write json file to: "'+filePath+'", error message:')
      helpers.error(writeError)
      throw writeError
    }
  },
  // Read a json file and return object
  readJsonFile : function(filePath) {
    try {
      return jsonfile.readFileSync(filePath)
    } catch(readError) {
      helpers.error('ERROR: Could not read json file from: "'+filePath+'", error message:')
      helpers.error(readError)
      throw readError
    }
  },
  // Check if json file exists
  existsJsonFile : function(filePath) {
    return fs.existsSync(filePath)
  },
  // Persist a json object
  saveJsonData : function(storageId, jsonObject) {
    if(jsonObject===undefined) throw new Error('No json object to persist has been provided. Required.')
    try {
      storage.setItemSync(storageId, jsonObject)
      return true
    } catch(writeError) {
      helpers.error('ERROR: Could not persist json to storage, id: "'+storageId+'", error message:')
      helpers.error(writeError)
      throw writeError
    }
  },
  // Retrieve a json object
  readJsonData : function(storageId) {
    try {
      return storage.getItemSync(storageId)
    } catch(readError) {
      helpers.error('ERROR: Could not read json object from storage, id: "'+storageId+'", error message:')
      helpers.error(readError)
      throw readError
    }
  },
  // Logger aid- message
  log : function(message, obj) {
    helpers.logWithType(message, undefined, obj);
  },
  // Logger aid- message
  info : function(message, obj) {
    helpers.logWithType(message, 'INFO', obj);
  },
  // Logger aid - debug
  debug : function(message, obj) {
    helpers.logWithType(message, 'DEBUG', obj)
  },
  // Logger aid - warn
  warn : function(message, obj) {
    helpers.logWithType(message, 'WARN', obj)
  },
  // Logger aid - error
  error : function(message, obj) {
    console.error(new Date().toISOString() + ': [ERROR] ' + JSON.stringify(message), (obj!==undefined? obj : ''))
  },
  // Logger aid- core function
  logWithType : function(message, type, obj) {
    console.log(new Date().toISOString() + ': ' + (type!==undefined? '['+type+'] ' : '') + JSON.stringify(message).replace(/\\"/g,'"'), (obj!==undefined? obj : ''))
  }
}

module.exports = helpers

require('./extensions.js') // Load default objects extensions
var shortid = require('shortid') // Load UUID char generator; https://www.npmjs.com/package/shortid

// Set up locals
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyz- ABCDEFGHIJKLMNOPQRSTUVWXYZ'); // Avoiding use of _ to match SSP requirements
var userNameRegex = /^(\D*)(.*)$/

// Define helper - custom in test helper functions available for dynamic referencing in tests i.e "API-TestOrg_${getUniqueId}" where getUniqueId is a function below
var inTestCustomHelperFunctions = {
  
  // Get a unqiue 16 digit/char UUID style string for use in requests
  getRequestId : function() {
    var hrTime = process.hrtime() // Nodejs default
    return ((hrTime[0] * 100)  + hrTime[1]) + shortid.generate()  // Use generated UUID and time
  },
  // Get unique id of 16 chars from ISO date (stripping off .736Z tail)
  getUniqueId : function() {
    return new Date().toISOString().replace('T','_').replace(/-/g,'').replace(/:/g,'').slice(0,-5)
  },
  // Get short id of 8 chars
  getShortId : function() {
    return shortid.generate().replace(/ /g,'_') // NOTE: Use underscore rather than space but not supported in alphabet
  },
  // Formats a easily human readable HH:mm:ss timestamp
  getHourMinute : function() {
    return new Date().toTimeString().split(' ')[0]
  },
  // Formats a ISO timestamp: 2017-06-02T13:44:56.736Z
  getTimeStamp : function() {
    return new Date().toISOString()
  },
  // Increments and appends a trailing integer to provider string. If string does not have a number, starting number will be 0
  getIncrementedName : function(somename) {
    var capture = userNameRegex.exec(somename)
    // If any matches to "username12345" style naming, increment
    if(capture.length>1) {
      // If no trailing number, append one
      if(capture[1].length == capture[0].length) return somename+"1"
      // Otherwise find trailing number and increment
      var baseName = capture[1].toString()
      var incrementPart = parseInt(somename.substring(baseName.length))
      incrementPart++
      return baseName+incrementPart
    }
    return somename // Default to same as input
  }
}

module.exports = inTestCustomHelperFunctions

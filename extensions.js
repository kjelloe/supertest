// Extending javascript objects
/* LOG ENTRY TO INDICATE AFFECTED FUNCTIONS */
console.log('Helper init: Extending: String.format(), Array.find() --- Adding GLOBAL(s): LOGLEVELS')

/* ---------- GLOBALS DEFINITION ----------- */
// Definining a (nodejs) global: Enum style log levels WITH embedded parse from string to enum
// TODO: Consider a full implementation of enums, such as: http://2ality.com/2016/01/enumify.html
var supportedLoglevels = { "NONE":0, "INFO":1, "WARN":2, "DEBUG":3, "ERROR":4, "ALL":5 }
// Add embedded parsing method for parsing from any input string to one of the supported items
supportedLoglevels.fromString = function(userInput) {
  var objectItems = this;
  for(var entry in objectItems) {
    if(userInput.trim().toUpperCase()==entry) return objectItems[entry];
  }
  throw new Error("Unsupported loglevel provided: \"{0}\". Please use one of the supported ones: {1}".format(userInput, supportedLoglevels.toString()))
}
// Add method to list enumeration values only
supportedLoglevels.toString = function() {
  var objectItems = this;
  var out = ''
  for(var entry in objectItems) { if(typeof(objectItems[entry]) !== 'function') out += ', ' + entry }
  return out.substring(2)
}
// Finally freezing the object so it cannot be modified and make it global
global.LOGLEVELS = Object.freeze(supportedLoglevels)

/* ---------- EXTENSIONS DEFINITION ----------- */
// TODO: Add other extensions to list; trim leading and trailing chars

// Extending string with printf-style format function
String.prototype.format = function() {
  var formatted = this;
  for (var i = 0; i < arguments.length; i++) {
      if(arguments[i] ===undefined) throw new Error('Cannot do String.format with undefined argument, index:' + i);
      var regexp = new RegExp('\\{'+i+'\\}', 'gi');
      formatted = formatted.replace(regexp, arguments[i]);
  }
  return formatted;
}
// Extending array with method for finding a sub-element with a specifc key-value
Array.prototype.find = function(key, val) {
  if(key===undefined || key===null) throw new Error('Key to look for in list is mandatory')
  if(val===undefined || val===null) throw new Error('Value to look for key='+key+' in list is mandatory')

  for (var i = 0; i < this.length; i++) {
    if(this[i][key]!==undefined && (this[i][key]===val || this[i][key].indexOf(val)!=-1)) {
      return this[i]
    }
  }

  return false
}
// Config loader require a json object with values that are other than null or undefined, they can have a default value, but if value is NULL a value must be provided via a profile/json
var fs = require('fs');
var helpers = require('./helpers'); // Locally defined helpers
var lodash_merge = require('lodash.merge'); // Merge deep function
var traverse = require('traverse'); // DOCS: https://github.com/substack/js-traverse

// Expose only a (static) constructure style function for loading config
module.exports = function(defaultJsonObject, processEnvName) {

  var self = new Object()

  // Json provided via command line can contain trailing parameters or other which needs to be removed before parsing json
  var cleanJsonCommandLineInputBeforeParsing = function(rawJson) {
    rawJson = rawJson.substring(0, rawJson.lastIndexOf('}')+2) // Remove any command line items trailing the json bracket and a closing quote or double-quote i.e "{ ... somejson...}" -l=DEBUG
    return rawJson.replace(/\"/g,'').replace(/\'/g,'"') // Removing any doubles quotes and replacing single quotes with double quotes
  }

  // Merge (with overwrite) the provided config object into the default configuration
  self.initFromObject = function (defaultJsonObject, providedConfigObject) {
    if(defaultJsonObject===undefined || self.isJSON (defaultJsonObject)===false)  { throw new Error("Config-loader:init requires json object with default keys and values to be provided. If none, provide any empty object.") }
    if(providedConfigObject===undefined || self.isJSON(providedConfigObject)===false)  { throw new Error("Config-loader:init provided config object is not a valid JSON object. Required.") }

    // List test arguments using node traversal to pick out keys for listing only
    var initParamList = traverse(defaultJsonObject).reduce(function (acc, x) {
      if (this.isLeaf && this.key!=='value' ) { acc += ', '+this.key }
      return acc;
    }, '');

    helpers.log('Arguments provided by test: '+initParamList.substring(2))

    // Applying provided settings
    // OBSOLETE: does only merge first level; Object.assign(defaultJsonObject, providedConfigObject)
    defaultJsonObject = lodash_merge(defaultJsonObject,providedConfigObject)

    // Then test for mandatory setting being NULL
    for(var k in defaultJsonObject) {
      if(defaultJsonObject[k] === null || defaultJsonObject[k] === undefined) { throw new Error("Missing setting of mandatory configuration value. Please provide a value for key: '"+k+"'"); }
    }

    // List all settings that were applied
    var settingsApplied = traverse(defaultJsonObject).reduce(function (acc, x) {
      if (this.isLeaf && this.key!=='value' ) { acc += ', '+this.key }
      return acc;
    }, '');

    helpers.log('Test configuration set for test: '+settingsApplied.substring(2))
    return defaultJsonObject;
  }

  // Load configuration data from json string or file. Name is passed through an environment variable which name is provided
  self.initFromEnvironmentVariable = function(defaultJsonObject, processEnvName) {
    if(processEnvName===undefined || processEnvName===null) { throw new Error('Missing name of environment variable containing json configuration to load. Required.') }
    var configItem = (process.env[processEnvName]? process.env[processEnvName] : null)
    if(configItem==null) { throw new Error('ERROR: Required configuration settings were NOT provided for config loader through configured environment variable: "'+processEnvName+'"'); }

    var configObject = {}
    // If file load content as object
    if(configItem.startsWith('FILE:')) {
      configObject = JSON.parse(fs.readFileSync(configItem.substring(5), 'utf8'));
    }
    else { // If string literal, parse it
      configObject = JSON.parse(cleanJsonCommandLineInputBeforeParsing(configItem)) // Cleaning up raw json input before parsing
    }
    return self.initFromObject(defaultJsonObject, configObject)
  }

  // Check if any input is a valid json object
  self.isJSON = function(anyThing) {
    if (typeof anyThing != 'string')
        anyThing = JSON.stringify(anyThing);

    try {
        JSON.parse(anyThing);
        return true;
    } catch (e) {
        return false;
    }
  }

  return self.initFromEnvironmentVariable(defaultJsonObject, processEnvName);
}
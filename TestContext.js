// TODO: Use ES6 proxy instead when available: https://stackoverflow.com/questions/1711357/how-would-you-overload-the-operator-in-javascript

function TestContext(name) {
    var inner = this;
    var self = new Object();
    self._instanceName = name;

    self.getName = function() {
      return self._instanceName
    }

    self.fromJsonObject = function(jsonObjectWithData) {
      var target = jsonObjectWithData;
      for (var prop in target ){
        if ((!target.hasOwnProperty(prop)) || (typeof(target[prop]) == 'array') || (typeof(target[prop]) == 'object') || (typeof(target[prop]) == 'function')) {
            continue;
        }
        self[prop] = target[prop];
      }
      return self; // Return filled instance
    }

    self.toJsonObject = function() {
      var target = self;
      var simpleObject = {};
      for (var prop in target ){
        if ((!target.hasOwnProperty(prop)) || (typeof(target[prop]) == 'array') || (typeof(target[prop]) == 'object') || (typeof(target[prop]) == 'function')) {
            continue;
        }
        simpleObject[prop] = target[prop];
      }
      return simpleObject; // returns cleaned up object ready for stringify
    }

    self.toString = function() {
      return JSON.stringify(self.toJsonObject());
    }

    return self;
}

TestContext.prototype.hasKey = function(key) {
    return self.hasOwnProperty(key)
};

TestContext.prototype.get = function(key) {
    if( self.hasOwnProperty(key) ) {
      var value = self[key]
      if(value===undefined) { throw new Error('No data defined for key "'+key+'" in TestContext instance.')  }
      return value
    }

    throw new Error('Key "'+key+'" does not exist in TestContext instance.')
};

TestContext.prototype.set = function(key, value) {
    if(value===undefined)  { throw new Error('Cannot set "undefined" value for key "'+key+'" in TestContext instance.')  }
      self[key] = value;
    return true // Return ok
};


// Expose a basic data object as test context
module.exports = function(instanceName) {
  return new TestContext(instanceName);
};

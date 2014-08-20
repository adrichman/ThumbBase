(function(){  
  'use strict';

  var forwardMethods = function(target, methods, source){
 
    // register methods onto a class that call the same-named methods from another class
    methods.forEach(function (methodName) {
      target[methodName] = function(){
        return source[methodName].apply(source, arguments);
      };
    });
    return target;
  };

  var isValid = function(ref){
    // cleaner checking for validity that allows values of 0
    return ref !== undefined && ref !== null;
  };

  module.exports = {
    forwardMethods : forwardMethods,
    isValid        : isValid
  };

}());

#! /usr/bin/env node

/////////////////////////////
// Instantiating ThumbBase //
/////////////////////////////

(function(){
  
  'use strict';
  var API = require('./CLI.js');
  
  var APP = function(){
    this.API = new API(); 
  };

  var App = new APP();
  
  // Start the APP
  App.API.next();

}());
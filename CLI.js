(function(){

  'use strict';

  ////////////////////////////////////////
  // CLI for interacting with ThumbBase //
  ////////////////////////////////////////

  var RL        = require('readline');
  var ThumbBase = require('./ThumbBase.js');
  var thumbBase = new ThumbBase();

  var API = function(){
    var self = RL.createInterface(process.stdin, process.stdout);
    var cmd;
    
    self.quitCommands = {
      end  : 1,
      exit : 1,
      q    : 1,
      quit : 1,
      close: 1
    };
    
    self.next = function(){
      this.setPrompt('> ');
      this.prompt();
    };

    self.on('line', function(line) {
      
      // Split arguments at spaces and normalize to lowecase
      line = line.split(' ');
      cmd  = line[0].toLowerCase();
      
      // Exit on quit command
      if (self.quitCommands[cmd]) process.exit(0);

      // Check for invalid ThumbBase method
      if (!thumbBase[cmd]){
        console.error(cmd.toUpperCase(), 'is not a valid command');
      } else {
        
        try {
          // Execute command, log response to STDOUT
          var exec = thumbBase[cmd](line[1], line[2]);
          console.log( exec === true ? '' : exec);
        } 

        catch (err) {
          // log error message to STDOUT
          console.error(err.message);
        }
      }

      // Advance to next prompt
      self.next();
    });
    
    self.on('close', function() {
      // exit properly
      process.exit(0);
    });
    
    return self;
  };
  
  module.exports = API;

}());

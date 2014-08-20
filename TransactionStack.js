(function(){

  'use strict';
  
  var DB;
  var util = require('./helpers.js');

  var TransactionStack = function(db){
    this._stack     = [];
    this._rolling   = false;
    this._writeable = false;
    DB = db;
  };

  TransactionStack.prototype.begin = function(){
    // Set the instance as writable to control when to record commands
    this._writeable = true;
    
    // Push a new transaction block onto the stack
    this._stack.push([]);

    return this.isWritingTransactions();
  };

  TransactionStack.prototype.commit = function(){
    // Purge the stack and remove write permission
    this._stack = [];
    this._writeable = false;
    return this._stack.length === 0;
  };

  TransactionStack.prototype.rollback = function(){
    
    // Throw error if there is no transaction block to rollback to
    if (!this._stack.length || !this._stack[0].length || !this.isWritingTransactions()){ 
      throw new Error('NO TRANSACTION');
    }

    // Set rolling status to prevent recursive set and add calls during rollback
    this._rolling = true;

    // Pop off the most recent transaction block
    var rollbackList = this._stack.pop();
    
    while (rollbackList.length) {
      // Iterate through each recorded transaction in the current rollback block
      var prevState = rollbackList.pop();
      if (prevState){
        if (!util.isValid(prevState.prevVal)) {

          // Unset the transaction's key if it was not previously present or valid
          DB.unset(prevState.key);

        } else if (prevState.command === 'unset') {

          // If the transaction called unset, set the transaction's key to its previous value
          DB.set(prevState.key, prevState.prevVal);
        } else if (prevState.command === 'set') {
          
          // If the transaction called set, unset the transaction's key...
          DB.unset(prevState.key);
          // ...then set it to its previous value
          DB.set(prevState.key, prevState.prevVal);
        
        }
      }
    }

    // Reset rolling status
    this._rolling = false;
    return rollbackList.length === 0;
  };

  TransactionStack.prototype.add = function(command){
    // command expects an array ['command', 'key', 'value', 'previous value']
    
    // short circuit if stack is not currently writeable 
    if (!this.isWritingTransactions()) return false;
      
    // assure there is a block to add transactions to
    if (this._stack.length === 0) this._stack.push([]);

    var prevState = {}; 
    if (DB._storage && DB._valueCountTable) {
      prevState.command = command[0];
      prevState.key = command[1]; 
      prevState.newVal = command[2]; 
      prevState.prevVal = command[3]; 
      prevState.prevCount = DB._valueCountTable.get(command[2]);
    }

    // push the transaction onto the transaction block stack 
    this._stack[this._stack.length-1].push(prevState);
  };

  TransactionStack.prototype.isWritingTransactions = function(){
    // friendly method names are nice
    return this._writeable;
  };

  module.exports = TransactionStack;

}());
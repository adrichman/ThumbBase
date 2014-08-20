(function(){

  'use strict';
  var DB;

  var TransactionStack = function(db){
    this._stack     = [];
    this._rolling   = false;
    this._writeable = false;
    DB = db;
  };

  TransactionStack.prototype.begin = function(){
    this._writeable = true;
    this._stack.push([]);
    return this.isWritingTransactions();
  };

  TransactionStack.prototype.commit = function(){
    this._writeable = false;
    this._stack = [];
    return this._stack.length === 0;
  };

  TransactionStack.prototype.rollback = function(){
    if (!this._stack.length || !this._stack[0].length || !this.isWritingTransactions()){ 
      throw new Error('NO TRANSACTION');
    }

    var rollbackList = this._stack.pop();
    
    this._rolling = true;
    
    while (rollbackList.length) {
      var prevState = rollbackList.pop();
      if (prevState){

        if (prevState.prevVal === undefined || prevState.prevVal === null) {
          DB.unset(prevState.key);
        } else if (prevState.command === 'unset') {
          DB.set(prevState.key, prevState.prevVal);
        } else if (prevState.command === 'set') {
          DB.unset(prevState.key);
          DB.set(prevState.key, prevState.prevVal);
        }
      
      }
    }
    this._rolling = false;
  };

  TransactionStack.prototype.add = function(command){
    // command expects an array ['command', 'key', 'value', 'previous value']
    if (this._stack.length === 0) this._stack.push([]);

    var prevState = {}; 
    
    if (DB._storage && DB._valueCountTable) {
      prevState.command = command[0];
      prevState.key = command[1]; 
      prevState.newVal = command[2]; 
      prevState.prevVal = command[3]; 
      prevState.prevCount = DB._valueCountTable.get(command[2]);
    }

    if (this.isWritingTransactions()) {
      this._stack[this._stack.length-1].push(prevState);
    }
  };

  TransactionStack.prototype.isWritingTransactions = function(){
    return this._writeable;
  };

  module.exports = TransactionStack;

}());
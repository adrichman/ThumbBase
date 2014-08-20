(function(){

  'use strict';

  var ValueCountTable  = require('./ValueCountTable.js');
  var TransactionStack = require('./TransactionStack.js');

  function forwardMethods(target, methods, source){
    methods.forEach(function (methodName) {
      target[methodName] = function(){
        return source[methodName].apply(source, arguments);
      };
    });
    return target;
  }

  function isValid(ref){
    return ref !== undefined && ref !== null;
  }

  var ThumbBase = function(){
    this._storage = {};
    this._valueCountTable = new ValueCountTable();
    this._transactionStack = new TransactionStack(this);
    forwardMethods(this, Object.keys(this._transactionStack.constructor.prototype), this._transactionStack);
  };

  ThumbBase.prototype.set = function(key, val){

    // check for valid parameters
    if (!isValid(key) || !isValid(val)) {
      throw new Error('Valid keys and values are required');
    }

    var prev = this._storage[key];

    // if a value is already stored with this key, decrement the value's count
    // before re-assigning the key
    isValid(prev) && this._valueCountTable.decrement(prev);
    this._valueCountTable.increment(val);

    // add this command to the transaction block stack if a block is open and
    // is not currently rolling back
    if (this.isWritingTransactions() && !this._transactionStack.rolling){
      this.add(['set', key, val, prev]);
    }

    // set the key to this value in storage
    this._storage[key] = val;
    return val === this._storage[key];
  };

  ThumbBase.prototype.get = function(key){
    if (!isValid(this._storage[key])) return null;
    return this._storage[key];
  };

  ThumbBase.prototype.unset = function(key){

    // decrement the value count for the value of the key being unset
    var prev = this._storage[key];
    if (isValid(prev) && isValid(this._valueCountTable.get(prev))) {
      this._valueCountTable.decrement(prev);
    }

    // add this command to the transaction block stack if a block is open and
    // is not currently rolling back
    if (this.isWritingTransactions() && !this._transactionStack.rolling) {
      this.add(['unset', key, null, prev]);
    }

    // set the key's value to null
    this._storage[key] = null;
    return this._storage[key] === null;
  };

  ThumbBase.prototype.numequalto = function(val){
    return this._valueCountTable.get(val) || 0;
  };


  module.exports = ThumbBase;

}());

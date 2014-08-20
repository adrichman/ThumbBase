(function(){

  'use strict';

  var ValueCountTable = function(){
    this._values = {};
  };

  ValueCountTable.prototype.contains = function(val){
    // check for value's presence
    if (this._values[val] === undefined) return false;
    return true;
  };

  ValueCountTable.prototype.increment = function(val){
    // if value is not present, initialize its count at 0
    if (!this.contains(val)) this._values[val] = 0;
    
    this._values[val]++; 
    return this._values[val];
  };

  ValueCountTable.prototype.decrement = function(val){
    // throw error for unfamiliar values
    if (!this.contains(val)) throw new Error('That value is not currently stored');

    // don't decrement a value of count 0
    this._values[val] && this._values[val]--;
    return this._values[val] || 0;
  };

  ValueCountTable.prototype.get = function(val){
    // return false for values not present
    if (!this.contains(val)) return false;

    return this._values[val];
  };

  ValueCountTable.prototype.set = function(val, count){
    this._values[val] = count;
    return this._values[val];
  };

  module.exports = ValueCountTable;

}());
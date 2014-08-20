(function(){

  'use strict';

  var ValueCountTable = function(){
    this._values = {};
  };

  ValueCountTable.prototype.contains = function(val){
    if (this._values[val] === undefined) return false;
    return true;
  };

  ValueCountTable.prototype.increment = function(val){
    if (!this.contains(val)) this._values[val] = 0;
    
    this._values[val] !== undefined && this._values[val]++; 
    return this._values[val];
  };

  ValueCountTable.prototype.decrement = function(val){
    if (!this.contains(val)) throw new Error('That value is not currently stored');

    this._values[val] && this._values[val]--;
    return this._values[val] || 0;
  };

  ValueCountTable.prototype.get = function(val){
    if (!this.contains(val)) return false;

    return this._values[val];
  };

  ValueCountTable.prototype.set = function(val, count){
    this._values[val] = count;
    return this._values[val];
  };


  module.exports = ValueCountTable;

}());
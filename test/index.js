(function(){

  'use strict';

  var expect    = require('chai').expect;
  var spawn     = require('child_process').spawn;
  var Q         = require('q');
  var ThumbBase = require('../ThumbBase.js');

  var spawnTest = function(arg){
    var deferred = Q.defer();
    var ps = spawn('/usr/local/bin/node', ['/Users/Port-O-Bucket/Desktop/Development/thumbBase/index.js', arg]);
    ps.stdout.setEncoding('utf8');
    
    var stdout = "";

    ps.stdout.on('data', function (data) {
      var out = data.split('\n')[0];
      stdout += out;
    });  
    
    ps.stderr.on('data', function (data) {
      deferred.reject(data);
    });
    
    ps.on('close', function (code) {
      console.log('process closed with code:', code);
      deferred.resolve(stdout);
    });
    
    return deferred.promise;
  };

  describe('thumbBase', function(){
    describe('Classes', function(){
      
      var thumbBase, valueCountTable;

      beforeEach(function(){
        thumbBase = new ThumbBase();
        valueCountTable = thumbBase._valueCountTable;
      });
      
      describe('ThumbBase', function(){

        it('contains a method for setting new keys/values', function(done){
          expect(thumbBase.set).to.be.a('function');
          done();
        });
        
        it('contains a method for getting keys/values', function(done){
          expect(thumbBase.get).to.be.a('function');
          done();
        });
        
        it('contains a method for unsetting keys', function(done){
          expect(thumbBase.unset).to.be.a('function');
          done();
        });

        it('contains extended Transaction Stack methods', function(done){
          expect(thumbBase.begin).to.be.a('function');
          expect(thumbBase.commit).to.be.a('function');
          expect(thumbBase.rollback).to.be.a('function');
          expect(thumbBase.add).to.be.a('function');
          done();
        });

        it('contains a hash table for storage', function(done){
          expect(thumbBase._storage).to.be.a('object');
          done();
        });

        it('contains a value count table', function(done){
          expect(thumbBase._valueCountTable).to.be.a('object');
          done();
        });

        it('can store a falsy value', function(done){
          expect(thumbBase.set('ADR', 0)).to.equal(true);
          expect(thumbBase.set('JBR', 0)).to.equal(true);
          expect(thumbBase.set('EFR', 0)).to.equal(true);
          done();
        });

        it('can set a value with a key', function(done){
          expect(thumbBase.set('ADR', 101)).to.equal(true);
          expect(thumbBase.set('JBR', 100)).to.equal(true);
          expect(thumbBase.set('EFR', 102)).to.equal(true);
          done();
        });

        it('throws an error for missing keys and values', function(done){
          expect(function(){
            thumbBase.set(undefined, undefined);
          }).to.throw('Valid keys and values are required');
          
          expect(function(){
            thumbBase.set('ADR', undefined);
          }).to.throw('Valid keys and values are required');
          
          expect(function(){
            thumbBase.set(undefined, 101);
          }).to.throw('Valid keys and values are required');
          
          done();
        });

        it('can get a value with a key', function(done){
          thumbBase.set('ADR', 101);
          expect(thumbBase.get('ADR')).to.equal(101);
          done();
        });

        it('can unset a key', function(done){
          thumbBase.set('ADR', 101);
          expect(thumbBase.unset('ADR')).to.equal(true);
          done();
        });

        it('can return the number of instances of a value stored', function(done){
          thumbBase.set('JBR', 100);
          thumbBase.set('SBR', 100);
          expect(thumbBase.numequalto(100)).to.equal(2);
          done();
        });
      });
      
      describe('ValueCountTable', function(){
        it('contains a hash table for storing values', function(done){
          expect(valueCountTable._values).to.be.a('object');
          done();
        });

        it('contains a method for incrementing value counts', function(done){
          expect(valueCountTable.increment).to.be.a('function');
          done();
        });
        
        it('contains a method for decrementing value counts', function(done){
          expect(valueCountTable.decrement).to.be.a('function');
          done();
        });
        
        it('contains a method for getting value counts', function(done){
          expect(valueCountTable.get).to.be.a('function');
          done();
        });
      });

      describe('TransactionStack', function(){
        it('contains a list for storing transaction commands', function(done){
          expect(thumbBase._transactionStack._stack).to.be.a('array');
          done();
        });
        
        it('tracks its state as writeable or unwritable', function(done){
          expect(thumbBase.isWritingTransactions()).to.be.a('boolean');
          done();
        });

        it('errors if ROLLBACK is called with an empty stack', function(done){
          expect(
            function(){
              thumbBase.commit();
              thumbBase.rollback();
            }
          ).to.throw('NO TRANSACTION');
          done();
        });

        it('makes its transactionStack\'s state writeable after receiving a BEGIN command', function(done){
          expect(thumbBase.begin()).to.equal(true);
          expect(thumbBase.isWritingTransactions()).to.equal(true);
          done();
        });

        it('makes its transactionStack\'s state not-writeable after receiving a COMMIT command', function(done){
          expect(thumbBase.commit()).to.equal(true);
          expect(thumbBase.isWritingTransactions()).to.equal(false);
          done();
        });

        it('keeps track of previous states when writeable', function(done){
          thumbBase.begin();
          thumbBase.add(['set', 'ADR', '1'], thumbBase._storage);
          thumbBase.add(['set', 'JBR', '2'], thumbBase._storage);
          var latest = thumbBase._transactionStack._stack.length -1;
          expect(thumbBase._transactionStack._stack[latest]).to.be.a('array');
          expect(thumbBase._transactionStack._stack[latest].length).to.equal(2);
          thumbBase.rollback();
          done();
        });
      });

      describe('transactions', function(){
        describe('integration with TransactionStack and ValueCountTable', function(){
          it('has a transactionStack that tracks transactions', function(done){
            thumbBase.begin();
            thumbBase.set('test1', 1);
            thumbBase.set('test2', 2);
            expect(thumbBase._transactionStack._stack[0].length).to.equal(2);
            expect(thumbBase.numequalto(2)).to.equal(1);
            expect(thumbBase.numequalto(1)).to.equal(1);
            thumbBase.rollback();
            expect(thumbBase._transactionStack._stack.length).to.equal(1);
            expect(thumbBase.numequalto(2)).to.equal(0);
            expect(thumbBase.numequalto(1)).to.equal(0);
            thumbBase.commit();
            done();
          });

          it('can handle nested transaction blocks', function(done){
            
            thumbBase.set('Transaction1', 5);
            
            thumbBase.begin();
            thumbBase.set('Transaction1', 1);
            thumbBase.set('Transaction2', 2);
            
            thumbBase.begin();
            thumbBase.set('Transaction2', 3);
            expect(thumbBase.get('Transaction2')).to.equal(3);
            thumbBase.rollback();
            
            thumbBase.unset('Transaction1');
            expect(thumbBase.get('Transaction1')).to.equal(null);
            expect(thumbBase.get('Transaction2')).to.equal(2);
            thumbBase.rollback();

            expect(thumbBase.get('Transaction1')).to.equal(5);
            expect(thumbBase.numequalto(3)).to.equal(0);
            expect(thumbBase.numequalto(2)).to.equal(0);
            thumbBase.commit();
            expect(thumbBase.numequalto(5)).to.equal(1);
            done();
          });
        });
      });
    });

    describe('validations', function(){

      xit('should bark at you if you don\'t feed it what it wants', function(done){
        spawnTest('WRONG')
        .then(function(stdout){
          expect(stdout).to.include('is not valid input');
          done();
        });
      });

      xit('should be silent for valid arguments', function(done){
        spawnTest('SET')
        .then(function(stdout){
          expect(stdout).not.to.be.ok;
          done();
        });
      });
    });
  });
  
}());
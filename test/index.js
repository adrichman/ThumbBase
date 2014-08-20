(function(){

  'use strict';
  
  var expect       = require('chai').expect;
  var spawn        = require('child_process').spawn;
  var Q            = require('q');
  var ThumbBase    = require('../ThumbBase.js');
  var promiseQueue = [];
  var stdout       = "";
  var stderr       = "";
  var ps;

  var writeTo = function(arg){
    // Method to write to STDIN 
    var deferred = Q.defer();
    
    // Clear past responses
    stdout = "";
    stderr = "";

    // write to STDIN
    ps.stdin.write(arg+'\n');

    // provide a new promise for the expected response
    promiseQueue.push(deferred);

    return promiseQueue[promiseQueue.length - 1].promise;
  };

  var spawnTest = function(){
    // Run the app in a child process
    ps = spawn('/usr/local/bin/node', [process.cwd() + '/index.js']);
    ps.stdout.setEncoding('utf8');
    
    // Register listeners on STDOUT and STDERR
    // Resolve with the oldest promise upon response
    ps.stdout.on('data', function (data) {
      var out = data.split('\n')[0];
      stdout += out;
      if (data !== '> '){
        promiseQueue.shift().resolve(out);
      }
    });  
    
    ps.stderr.on('data', function (data) {
      var out = data.toString().split('\n')[0];
      stderr += out;
      promiseQueue.shift().reject(out);
    });
    
    ps.on('close', function (code) {
      promiseQueue.shift().resolve(code);
    });
    return ps;
  };

  describe('APP', function(){
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
    describe('integration tests', function(){
      describe('validations', function(){
        var ps;
        beforeEach(function(){
          ps = spawnTest();
          stdout = "";
          stderr = "";
        });

        it('should not accept invalid commands', function(done){
          writeTo('WRONG')
          .then(function(){},function(){
            expect(stderr).to.include('is not a valid command');
            writeTo('q');
            done();
          });
        });

        it('should not accept incomplete parameters', function(done){
          writeTo('SET')
          .then(function(){},function(){
            expect(stderr).to.include('Valid keys and values are required');
            writeTo('q');
            done();
          });
        });
      });

      describe('script', function(){
        
        before(function(){
          ps = spawnTest();
        });

        beforeEach(function(){
          stdout = "";
          stderr = "";
        });
        
        after(function(){
          ps.connected && writeTo('q');
        });
        
        it('should accept valid requests', function(done){
          writeTo('SET a 10').then(function(){
          writeTo('SET b 10').then(function(){
          writeTo('NUMEQUALTO 10').then(function(res){
            expect(res).to.equal('2');
            done();
          });
        });});});

        it('should handle multiple transactions', function(done){
          writeTo('BEGIN').then(function(){
          writeTo('SET a 30').then(function(){
          writeTo('BEGIN').then(function(){
          writeTo('SET a 40').then(function(){
          writeTo('GET a').then(function(res){
            expect(res).to.equal('40');
          }).then(function(){
          writeTo('ROLLBACK').then(function(){
          writeTo('NUMEQUALTO 40').then(function(res){
            expect(res).to.equal('0');
          writeTo('GET a').then(function(res){
            expect(res).to.equal('30');
          writeTo('NUMEQUALTO 30').then(function(res){
            expect(res).to.equal('1');
            done();
          });});});});});});});});});
        });
        
        it('should quit gracefully', function(done){
          writeTo('q')
          .then(function(res){
            expect(res).to.equal(0);
            done();
          });
        });
      });
    });
  });
}());

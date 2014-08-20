# ThumbBase
An in-memory key/value store with support for transaction blocks, rollbacks, and commits.

### Installation:
```
npm install
```

### To start:
```
npm start
```

### Run tests:
```
npm test
```

### Performance:

The app uses Javascript Objects ```{}``` in place of re-implementing hash tables.

In constant time ```O(1)```, Thumbase can ```set```, ```get```, and ```unset``` keys, as well as retrieve a count ```NUMEQUALTO``` for the number of currently stored instances of a value.

At the expense of space, ```NUMEQUALTO``` maintains constant time access to value counts by storing the values in a separate hash table. 

Thumbase maintains a stack for a transaction block that becomes active on the ```BEGIN``` command. When ```COMMIT``` is called, the stack is purged and the changes remain written. If ```ROLLBACK``` is called before ```COMMIT```, the changes are undone in linear time ```0(n)```. (```n``` === number of transaction commands in the stack, NOT the number of keys/values stored).

Thumbase handles nested transaction blocks. A new block is instantiated on every ```BEGIN``` command. This allows for a ```ROLLBACK``` to a previous block that is in-progress and not yet committed.
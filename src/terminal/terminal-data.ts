
// Open (or create) the database
var openDb = indexedDB.open('Terminal', 1);

// Create the schema
openDb.onupgradeneeded = function() {
    var db = openDb.result;
    var store = db.createObjectStore('WpmStore', {keyPath: 'id'});
    var index = store.createIndex('CharacterIndex', ['character']);
};

openDb.onsuccess = function() {
    // Start a new transaction
    var db = openDb.result;
    var tx = db.transaction('WpmStore', 'readwrite');
    var store = tx.objectStore('WpmStore');
    var index = store.index('CharacterIndex');

    // Add some data
    store.put({id: 1, character: 'a', wpm: 0.5, timestamp: new Date('1900-01-01')});
    store.add({id: 4,character: 'c', wpm: 0.5, timestamp: new Date()});

    // Query the data
    var getA = index.get(['a']);
    getA.onsuccess = function() {
    };

    // Close the db when the transaction is done
    tx.oncomplete = function() {
        db.close();
    };
};

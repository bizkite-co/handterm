
// Open (or create) the database
var openDb = indexedDB.open('Terminal', 1);

// Create the schema
openDb.onupgradeneeded = function() {

};

openDb.onsuccess = function() {
    // Start a new transaction
    const db = openDb.result;
    const tx = db.transaction('WpmStore', 'readwrite');
    const store = tx.objectStore('WpmStore');
    const index = store.index('CharacterIndex');

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

// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
const { query } = require('express');


let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

let app = express();
let port = 8000;


//express will automatically parse parameters
app.use(express.json());

// Open SQLite3 database (in read-write mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});


// GET request handler for crime codes
app.get('/codes', (req, res) => {
    let query = "SELECT * FROM Codes";
    //console.log(req.query); // query object (key-value pairs after the ? in the url)
    let query_object = {};
    let clause = " WHERE code = ";
    if(req.query.hasOwnProperty("codes")){
        for (const [key, value] of Object.entries(req.query)) {
            if(key == "codes"){
                let new_values = value.split(",");
                for(let i=0; i<new_values.length; i++){
                    query = query + clause + new_values[i];
                    clause = " OR code = ";
                }
            }
        }
        query = query + " ORDER BY code";
    }

    databaseSelect(query, [])
    .then((data) => {
        console.log(data);
        res.status(200).type('json').send(data); // <-- you will need to change this
    })
    .catch((err) => {
        res.status(200).type('html').send("Make sure that your requested codes are in csv format. E.g. ?codes=110,120,432,620"); // <-- you will need to change this
    })
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    let query = "SELECT * FROM Neighborhoods";
    //console.log(req.query); // query object (key-value pairs after the ? in the url)
    let query_object = {};
    let clause = " WHERE neighborhood_number = ";
    if(req.query.hasOwnProperty("id")){
        for (const [key, value] of Object.entries(req.query)) {
            if(key == "id"){
                let new_values = value.split(",");
                for(let i=0; i<new_values.length; i++){
                    query = query + clause + new_values[i];
                    clause = " OR neighborhood_number = ";
                }
            }
        }
        query = query + " ORDER BY neighborhood_number";
    }

    databaseSelect(query, [])
    .then((data) => {
        console.log(data);
        res.status(200).type('json').send(data); // <-- you will need to change this
    })
    .catch((err) => {
        res.status(200).type('html').send("Make sure that your requested codes are in csv format. E.g. ?codes=110,120,432,620"); // <-- you will need to change this
    })
});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    
    res.status(200).type('json').send({}); // <-- you will need to change this
});

// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    console.log(req.body); // uploaded data
    
    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});

// DELETE request handler for new crime incident
app.delete('/remove-incident', (req, res) => {
    console.log(req.body); // uploaded data
    
    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});



//Promise version of db.all
// Create Promise for SQLite3 database SELECT query 
function databaseSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    })
}

// Create Promise for SQLite3 database INSERT or DELETE query
function databaseRun(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}


// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});

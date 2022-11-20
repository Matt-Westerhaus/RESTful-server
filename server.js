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
    let clause = " WHERE code = ";
    for (const [key, value] of Object.entries(req.query)) {
        if(key == "code"){
            let new_values = value.split(",");
            for(let i=0; i<new_values.length; i++){
                query = query + clause + new_values[i];
                clause = " OR code = ";
            }
        }
    }
    query = query + " ORDER BY code";
    

    databaseSelect(query, [])
    .then((data) => {
        console.log(data);
        res.status(200).type('json').send(data); 
    })
    .catch((err) => {
        res.status(200).type('html').send("Make sure that your requested codes are in csv format. E.g. ?codes=110,120,432,620");
    })
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    let query = "SELECT * FROM Neighborhoods";
    let clause = " WHERE neighborhood_number = ";
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

    databaseSelect(query, [])
    .then((data) => {
        console.log(data);
        res.status(200).type('json').send(data); 
    })
    .catch((err) => {
        res.status(200).type('html').send("Make sure that your requested neighborhoods are in csv format. (E.g: ?codes=5,8,10");
    })
});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let query = "SELECT * FROM incidents";
    let limit = 50;
    let clause = " WHERE (";
    let new_values
    let i;



    for (const [key, value] of Object.entries(req.query)) {
        if(key == "start_date"){

            query = query + clause + "date(date_time) >= " + "'" + value + "'";
            clause = ") AND (";
        } else if(key == "end_date"){
            query = query + clause + "date(date_time) <= " + "'" + value + "'";
            clause = ") AND (";

        } else if(key == "code"){
            new_values = value.split(",");
            for(i=0; i<new_values.length; i++){
                query = query + clause + "code = " + new_values[i];
                clause = " OR ";
            }
            clause = ") AND ("
        } else if(key == "grid"){
            new_values = value.split(",");
            for(i=0; i<new_values.length; i++){
                query = query + clause + "police_grid = " + new_values[i];
                clause = " OR ";
            }
            clause = ") AND ("
        } else if(key == "neighborhood"){
            new_values = value.split(",");
            for(i=0; i<new_values.length; i++){
                query = query + clause + "neighborhood_number = " +  new_values[i];
                clause = " OR ";
            }
        } else if(key == "limit"){
            limit = value;
        }
        
    }

    
    query = query + ") ORDER BY date_time ASC LIMIT " + limit;
    //query = "SELECT * FROM incidents where date(date_time) > '2022-01-02' ORDER BY date_time ASC LIMIT 15";
    console.log(query);
    databaseSelect(query, [])
    .then((data) => {
        console.log(data);
        res.status(200).type('json').send(data); 
    })
    .catch((err) => {
        res.status(200).type('html').send(err); // <-- you will need to change this
        //res.status(200).type('html').send("Make sure that your requested neighborhoods are in csv format. (E.g: ?codes=5,8,10"); // <-- you will need to change this
    })
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

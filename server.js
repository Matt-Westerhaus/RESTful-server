// Built-in Node.js modules
let fs = require('fs');
let path = require('path');
let cors = require('cors');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
const { query } = require('express');
const e = require('express');

let public_dir = path.join(__dirname, 'public');

let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

let app = express();
let port = 8001;


//express will automatically parse parameters
app.use(express.json());
app.use(cors());
app.use(express.static(public_dir)); //give public 

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
    query = query + " ORDER BY neighborhood_number ASC";

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
    console.log(req.query); 
    let query = "SELECT case_number, SUBSTRING(date_time,1,10) AS date, SUBSTRING(date_time,12,19) AS time, code, incident, police_grid, neighborhood_number, block FROM incidents";
    let limit = 1000;
    let clause = " WHERE (";
    let new_values
    let i;

    for (const [key, value] of Object.entries(req.query)) {
        if(key == "start_date"){
            query = query + clause + "date(date) >= " + "'" + value + "'";
            clause = ") AND (";

        } else if(key == "end_date"){
            query = query + clause + "date(date) <= " + "'" + value + "'";
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
            clause = ") AND (";
            
        } else if(key == "limit"){
            limit = value;
        }        
    }

    if((clause == " WHERE (" && req.query.hasOwnProperty("limit")) || clause == " WHERE (") {
        query = "SELECT case_number, SUBSTRING(date_time,1,10) AS date, SUBSTRING(date_time,12,19) AS time, code, incident, police_grid, neighborhood_number, block FROM incidents ORDER BY date DESC, time DESC LIMIT " + limit;
    } else {
        query = query + ") ORDER BY date ASC, time LIMIT " + limit;
    }    
    console.log(query);
    databaseSelect(query, [])
    .then((data) => {
        res.status(200).type('json').send(data); 
    })
    .catch((err) => {
        res.status(500).type('html').send("Make sure that your requested parameters are in csv format. (E.g: ?code=5,8,10)"); 
    })
});


// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    console.log(req.body); 
    let query = 'INSERT INTO incidents VALUES (?, ?, ?, ?, ?, ?, ?);';
    let date_time = req.body.date + "T" + req.body.time;
    let parameters = [req.body.case_number, date_time, req.body.code, req.body.incident, req.body.police_grid, req.body.neighborhood_number, req.body.block];

    databaseRun(query, parameters)
    .then((data) => {
        res.status(200).type('txt').send('Success'); 
    })
    .catch((err) => {
        res.status(500).type('txt').send("This case number is already present in the database, please upload a different case."); 
    })
});



// DELETE request handler for crime incident
app.delete('/remove-incident', (req, res) => {
    console.log(req.body); 
    let query = "DELETE FROM incidents WHERE case_number = ?";
    databaseSelect("SELECT COUNT(*) AS count from incidents WHERE case_number = ?", [req.body.case_number])
    .then((data) => {
        if(data[0].count == 0) {
            throw "Case doesn't exist";
        } 
        databaseRun(query, [req.body.case_number]) 
        .then(() =>{
            res.status(200).type('txt').send('Success'); 
        })
    })
    .catch((err) => {
        res.status(500).type('txt').send('Error: Case number does not exist in the database, please select a different case to delete.');
    })

    
});



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

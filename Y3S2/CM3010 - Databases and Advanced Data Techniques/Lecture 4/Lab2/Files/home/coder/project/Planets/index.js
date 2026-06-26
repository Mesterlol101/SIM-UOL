// Import libraries
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const mustacheExpress = require('mustache-express');

// Initialise objects and declare constants
const app = express();
const webPort = 8088;

const db = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "Astronomy"
});

db.connect((err) => {
	if(err) {
		throw err;
	}
	console.log("Connected to database");
});

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', './templates');
app.use(bodyParser.urlencoded({ extended: true }));

function templateRenderer(template, response){
	return function(error, results, fields){
		if(error){
			throw error;
		}
		response.render(template, { data: results });
	}
}

app.get('/', function(req, res){
	const data = {};
	db.query("SELECT * FROM Planets", templateRenderer('index', res));
});
app.listen(
  webPort,
  () => console.log('EMO app listening on port '+webPort) // success callback
);

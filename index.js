'use strict';
const express = require('express');
const app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static('assets'));
app.use(express.static('images'));

const mongodb = require('mongodb');
const http = require('http');
const nconf = require('nconf');

let uri = `mongodb://admin:dcsc4lyfe2018@dcsc-shard-00-00-oixna.gcp.mongodb.net:27017,dcsc-shard-00-01-oixna.gcp.mongodb.net:27017,dcsc-shard-00-02-oixna.gcp.mongodb.net:27017/test?ssl=true&replicaSet=DCSC-shard-0&authSource=admin&retryWrites=true`;
if (nconf.get('mongoDatabase')) {
  uri = `${uri}/${nconf.get('mongoDatabase')}`;
}
console.log(uri);

var timestamp = new Date().getTime();
var date = new Date(timestamp);
var date_obj = {
  month: date.getMonth() + 1,
  day: date.getDate(),
  year: date.getFullYear(),
  hour: date.getHours(),
  minutes: date.getMinutes(),
  seconds: date.getSeconds()
}

app.post("/", (req, res) => {

  mongodb.MongoClient.connect(uri, (err, db) => {
    if (err) {
      throw err;
    }
    var dbo = db.db("dcsc_tests");
    var myobj = {
      timestamp: date_obj,
      first_Name: req.body.firstName,
      last_Name: req.body.lastName,
      class_year: req.body.year,
      email: req.body.email,
      bitbyte_status: req.body.bitbyte,
      source: req.body.source,
    };

  dbo.collection("members").insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
  });
  });

  res.sendFile(__dirname + "/index.html")

});


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const server = app.listen(8080, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`Example app listening at http://${host}:${port}`);
});

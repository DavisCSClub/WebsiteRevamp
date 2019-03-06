'use strict';

const express = require('express');
const app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static('assets'));
app.use(express.static('images'));

const mongoose = require('mongoose');
const http = require('http');
const nconf = require('nconf');

let uri = `mongodb://admin:dcsc4lyfe2018@dcsc-shard-00-00-oixna.gcp.mongodb.net:27017,dcsc-shard-00-01-oixna.gcp.mongodb.net:27017,dcsc-shard-00-02-oixna.gcp.mongodb.net:27017/dcsc?ssl=true&replicaSet=DCSC-shard-0&authSource=admin&retryWrites=true`;

console.log(uri);

mongoose.connect(uri);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  console.log("Connected to database!")
});

const memberSchema = new mongoose.Schema({
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  year: {
    type: String,
    default: ''
  },
  bitbyte: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: ''
  }
});

var Member = mongoose.model('Member', memberSchema)

app.post("/", (req, res) => {

  var newMember = new Member(req.body);

  console.log(newMember)
  newMember.save(function (err, newMember) {
    if (err) return console.error(err);
  });

  res.sendFile(__dirname + "/index.html")
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})


const server = app.listen(8080 | process.env.PORT , () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`Example app listening at http://${host}:${port}`);
});

'use strict';

const express = require('express');
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./client_secret');
const app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static('client/assets'));
app.use(express.static('client/images'));

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
  },
  eventDay: {
    type: String,
    default: ''
  },
  eventMonth: {
    type: String,
    default: ''
  },
  eventYear: {
    type: String,
    default: ''
  },

});

var date = new Date();

var year = date.getFullYear();
var month = date.getMonth() + 1;
month = (month < 10 ? "0" : "") + month;
var day  = date.getDate();
day = (day < 10 ? "0" : "") + day;

var Member = mongoose.model('Member', memberSchema)

app.post("/", (req, res) => {

  var newMember = new Member({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    year: req.body.year,
    bitbyte: req.body.bitbyte,
    source: req.body.source,
    eventDay: day,
    eventMonth: month,
    eventYear: year
  });

  newMember.save(function (err, newMember) {
    if (err) return console.error(err);
  });

  addToSpreadsheet(newMember)


  res.sendFile(__dirname + "/client/index.html")
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html")
})


async function addToSpreadsheet (member) {
  const doc = new GoogleSpreadsheet('1DLrimkYI1BLhXU_8ow2igEavVA0xCL0CNT3JB74MYCI');
  await promisify(doc.useServiceAccountAuth)(creds);
  const info = await promisify(doc.getInfo)();

  const sheet = info.worksheets[1];

  const row = {
    FirstName: member.firstName,
    LastName: member.lastName,
    Email: member.email,
    Year: member.year,
    BitByte: member.bitbyte,
    Source: member.source
  }

  await promisify(sheet.addRow)(row)

  console.log("New entry added to speadsheet")
}



const server = app.listen(process.env.PORT || 3000 , () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`Example app listening at http://${host}:${port}`);
});

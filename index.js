/*
imports packages required from the node modules folder
*/
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
const mongoose = require('mongoose');
const http = require('http');
const nconf = require('nconf');

/*
imports the folders where the html page is stored along with the all the images we use
*/
app.use(express.static('client/assets'));
app.use(express.static('client/images'));

/*
Uses the connection string provided by MongoDB to connect to our particular database. Should print out "connected to database" when it does, error message otherwise.
*/
let uri = `mongodb://admin:dcsc4lyfe2018@dcsc-shard-00-00-oixna.gcp.mongodb.net:27017,dcsc-shard-00-01-oixna.gcp.mongodb.net:27017,dcsc-shard-00-02-oixna.gcp.mongodb.net:27017/dcsc?ssl=true&replicaSet=DCSC-shard-0&authSource=admin&retryWrites=true`;
console.log(uri);
mongoose.connect(uri);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to database!")
});

/*
Defines the schema for the member information we want to store. Think of this as a C++ class where we define the fields within our class along with their type (and default value).
var member instantiates a new model based on our schema, which we can then use when we want to create a new member.
*/
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

var Member = mongoose.model('Member', memberSchema)

/*
Uses predifned functions to construct a string containing the date, which could then be used later on when we want to include a timestamp on a members login.
*/
var date = new Date();
var year = date.getFullYear();
var month = date.getMonth() + 1;
month = (month < 10 ? "0" : "") + month;
var day  = date.getDate();
day = (day < 10 ? "0" : "") + day;
var datestring = year + "" + month + "" + day
var datestring_sheet = month + "/" + day + "/" + year

/*
Our main post method that parses information from the signin page to create a new member and then save this member into our database.
It also calls the addToSpreadsheet function which creates a new row on the spreadsheet with the same fields.
Once we've saved all the user information, we reload the page using res.sendFile(.....).
*/
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

/*
This function gets called everytime a user goes to "daviscsclub.org/". At this point we would just want to display our home page so we'd use res.sendFile(..../index.html).
If more pages need to be added, we would define another function called app.get("/<nameofnewpage>", (req, res))... and call res.sendFile on the new html page you'd want to show.
*/
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html")
})

/*
This function uses the Google drive API to add the new users information into our spreadsheet.
We first connect to the document using the spreadsheet id.
We then call getinfo to recieve relevant information about the spreadsheet we're working with.
Construct a row object using the same fields as the member object
We then try adding a new sheet based on the current date -> if such a sheet exists already, if would return an
error, in which case we just loop through all the worksheets until we find the one we want for the current date. After this, we just call addrow to add the new row object.
If it was able to successfully create a new worksheet, we would need to initialize it with a new headerrow, after which we can call addrow again to insert our new user.
*/
async function addToSpreadsheet (member) {
  const doc = new GoogleSpreadsheet('1DLrimkYI1BLhXU_8ow2igEavVA0xCL0CNT3JB74MYCI');
  await promisify(doc.useServiceAccountAuth)(creds);
  const info = await promisify(doc.getInfo)();

  const row = {
    Timestamp: datestring_sheet,
    FirstName: member.firstName,
    LastName: member.lastName,
    Email: member.email,
    Year: member.year,
    BitByte: member.bitbyte,
    Source: member.source,
  }

  doc.addWorksheet({title: datestring + "_Signins"}, function (err, sheet1) {
    if (err) {
      console.log("Found existing spreadsheet")
      var sheet;
      var i = 0;
      for (; i < info.worksheets.length; i++){
        if (info.worksheets[i].title === (datestring + "_Signins")){
          sheet = info.worksheets[i]
        }
      }

      sheet.addRow(row, function(err){
        if (err) console.log(err)
      })

      console.log("New entry added to spreadsheet")
      return
    } else {
      console.log("New sheet created")

      sheet1.setHeaderRow(["Timestamp", "FirstName", "LastName", "Email", "Year", "BitByte", "Source"], function(err) {
        if (err) console.log(err)
        else {
          sheet1.addRow(row, function(err){
            if (err) console.log(err)
          })
        }
      })

      console.log("New entry added to spreadsheet")
    }
  })


}

/*
Sets up either the production (process.env.port) or local server.
To view the project locally, run npm start and navigate to localhost:3000
*/
const server = app.listen(process.env.PORT || 3000 , () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`Example app listening at http://${host}:${port}`);
});

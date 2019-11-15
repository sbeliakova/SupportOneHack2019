/* eslint-disable no-console, no-path-concat */

var opentok;
var sessionId
var bodyParser = require('body-parser')
var express = require('express');
var router = express.Router();
var path = require('path');
var app = express();
var _ = require('lodash');
var Nexmo = require('nexmo')
var request = require ('request')
var Zendesk = require('zendesk-node-api');
var ejs = require('ejs')
var cors = require('cors');
const dotenv = require('dotenv')
dotenv.config();

var zendesk = new Zendesk({
  url: 'process.env.ZD_Url', // https://example.zendesk.com
  email: "process.env.ZD_email", // me@example.com
  token: "process.env.ZD_token" // hfkUny3vgHCcV3UfuqMFZWDrLKms4z3W2f6ftjPT
});
var apiKey = process.env.TB_apiKey;
var apiSecret = process.env.TB_apiSecret;

if (!apiKey || !secret) {
  console.error('=========================================================================================================');
  console.error('');
  console.error('Missing TOKBOX_API_KEY or TOKBOX_SECRET');
  console.error('Find the appropriate values for these by logging into your TokBox Dashboard at: https://tokbox.com/account/#/');
  console.error('Then add them to ', path.resolve('.env'), 'or as environment variables' );
  console.error('');
  console.error('=========================================================================================================');
  process.exit();
}

var OpenTok = require('opentok');
var opentok = new OpenTok(apiKey, secret);
const nexmo = new Nexmo({
    apiKey: process.env.Nexmo_apiKey,
    apiSecret: process.env.Nexmo_apiSecret
    
  }, {debug:false})

// Verify that the API Key and API Secret are defined

app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
// Initialize the express app
app.use(express.static(__dirname + '/public'));
app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
}));

// Starts the express app
function init() {
  app.listen(8080, function () {
    console.log('You\'re app is now ready at http://localhost:8080/');
  });
}

// Initialize OpenTok


// Create a session and store it in the express app
opentok.createSession({ mediaMode: 'routed' }, function (err, session) {
  if (err) throw err;
  app.set('sessionId', session.sessionId);
  app.set('layout', 'horizontalPresentation');
  // We will wait on starting the app until this is done
  init();
});

app.get('/', function (req, res) {
  res.render('index.html');
});



// IMPORTANT: roomToSessionIdDictionary is a variable that associates room names with unique
// unique sesssion IDs. However, since this is stored in memory, restarting your server will
// reset these values if you want to have a room-to-session association in your production
// application you should consider a more persistent storage

var roomToSessionIdDictionary = {};

// returns the room name, given a session ID that was associated with it
function findRoomFromSessionId(sessionId) {
  return _.findKey(roomToSessionIdDictionary, function (value) { return value === sessionId; });
}

/**
 * GET /session redirects to /room/session
 */
app.get('/session', function (req, res) {
  res.redirect('/room/session');
});



/**
 * GET /room/:name
 */
app.get('/room/:name', function (req, res) {
  var roomName = req.params.name;
  var sessionId;
  var token;
  console.log('attempting to create a session associated with the room: ' + roomName);
  console.log(roomToSessionIdDictionary);


// find if the request is valid by checking ticket ID and request ID

  let requesterId = roomName.split("-")[0]
  let ticketId = roomName.split("-")[1]
  console.log(requesterId, ticketId)
  var options = { method: 'GET',
  url: 'https://nexmo1443765028.zendesk.com/api/v2/tickets/' + ticketId,
  headers: 
   { Accept: 'application/json',
   Authorization: 'Basic amF2aWVyLm1vbGluYXNhbnpAdm9uYWdlLmNvbTpHaXRhbnV6YTEyMzQ1Njc5QA==' } };

request(options, function (error, response, body) {
  if (error) {console.log(error)};

  let jsonParsed = JSON.parse(body)
  let assignee_id = jsonParsed.ticket.assignee_id
  console.log('Requester ID and ticket are ', jsonParsed.ticket.requester_id, jsonParsed.ticket.id )

// Checking that the user is a customer and that they ticket was created by them

            if (jsonParsed.ticket.requester_id == requesterId){
              
              var notification  = 'Someone would like to talk to you. Please join https://49dacf8d.ngrok.io with the code ' + roomName
              console.log(notification)

                zendesk.tickets.update(jsonParsed.ticket.id, {
                     comment:{"body": notification, "public": false}
                     
                  }).then(function(result){
                    console.log(result);
                  });

                  //Getting phone number of the assignee to be notifed

              zendesk.users.show(assignee_id.toString()).then(function(result){
                let number = result.phone;
                console.log(result.phone);
                //sending message to the asignee to 
                sendMessage(number, notification)
            })
                


            }
            else{console.log('Unauthorised')}


});


  // if the room name is associated with a session ID, fetch that
  if (roomToSessionIdDictionary[roomName]) {
    sessionId = roomToSessionIdDictionary[roomName];

    // generate token
    token = opentok.generateToken(sessionId);
    res.setHeader('Content-Type', 'application/json');
    res.send({
      apiKey: apiKey,
      sessionId: sessionId,
      token: token
    });
  }
  // if this is the first time the room is being accessed, create a new session ID
  else {
    opentok.createSession({ mediaMode: 'routed' }, function (err, session) {
      if (err) {
        console.log(err);
        res.status(500).send({ error: 'createSession error:' + err });
        return;
      }

      // now that the room name has a session associated wit it, store it in memory
      // IMPORTANT: Because this is stored in memory, restarting your server will reset these values
      // if you want to store a room-to-session association in your production application
      // you should use a more persistent storage for them
      roomToSessionIdDictionary[roomName] = session.sessionId;

      // generate token
      token = opentok.generateToken(session.sessionId);
      res.setHeader('Content-Type', 'application/json');
      res.send({
        apiKey: apiKey,
        sessionId: session.sessionId,
        token: token
      });
    });
  }
});


app.post('/archive/start', function (req, res) {
  var json = req.body;
  var sessionId = json.sessionId;
  opentok.startArchive(sessionId, { name: 'Important Presentation' }, function (err, archive) {
    if (err) {
      console.error('error in startArchive');
      console.error(err);
      res.status(500).send({ error: 'startArchive error:' + err });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(archive);
  });
});

app.post('/archive/:archiveId/stop', function (req, res) {
  var archiveId = req.params.archiveId;
  console.log('attempting to stop archive: ' + archiveId);
  opentok.stopArchive(archiveId, function (err, archive) {
    if (err) {
      console.error('error in stopArchive');
      console.error(err);
      res.status(500).send({ error: 'stopArchive error:' + err });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(archive);
  });
});

app.get('/archive/:archiveId/view', function (req, res) {
  var archiveId = req.params.archiveId;
  console.log('attempting to view archive: ' + archiveId);
  opentok.getArchive(archiveId, function (err, archive) {
    if (err) {
      console.error('error in getArchive');
      console.error(err);
      res.status(500).send({ error: 'getArchive error:' + err });
      return;
    }

    if (archive.status === 'available') {
      res.redirect(archive.url);
    } else {
      res.render('view', { title: 'Archiving Pending' });
    }
  });
});

app.post('/events', function (req, res){
  console.log(req.body);
  res.send('OK')
})



function sendMessage(to, message) {
	nexmo.message.sendSms('videosupport', to, message,
		(err, responseData) => {
			if (err) {
				console.log(err);
			} else {
				console.dir(responseData.messages);
			}
		})
}
  




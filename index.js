/* eslint-disable no-console, no-path-concat */
let sessionId
const fs = require('fs');
const bodyParser = require('body-parser')
const express = require('express');
const router = express.Router();
const path = require('path');
const app = express();
const _ = require('lodash');
const Nexmo = require('nexmo')
const request = require ('request')
const Zendesk = require('zendesk-node-api');
const ZD = require('node-zendesk');
const ejs = require('ejs')
const cors = require('cors');
const dotenv = require('dotenv')
dotenv.config();
let apiKey = process.env.apiKey
let  apiSecret = process.env.apiSecret
const AWS = require('aws-sdk');

const client = ZD.createClient({
  username:  process.env.username,
  token:     process.env.token,
  remoteUri: process.env.remoteUri
});

const OpenTok = require('opentok');
const opentok = new OpenTok(apiKey, apiSecret);

app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
// Initialize the express app
app.use(express.static(__dirname + '/public'));
app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
}));

let ticketId

// Starts the express app
let init = () => {
  app.listen(8080, function () {
    console.log('You\'re app is now ready at http://localhost:8080/');
  });
}

// Create a session and store it in the express app
opentok.createSession({ mediaMode: 'routed' },  (err, session) => {
  if (err) throw err;
  app.set('sessionId', session.sessionId);
  app.set('layout', 'horizontalPresentation');
  // We will wait on starting the app until this is done
  init();
});

app.get('/',  (req, res) => {
  res.render('index.html');
});

// IMPORTANT: roomToSessionIdDictionary is a variable that associates room names with unique
// unique sesssion IDs. However, since this is stored in memory, restarting your server will
// reset these values if you want to have a room-to-session association in your production
// application you should consider a more persistent storage

 let roomToSessionIdDictionary = {};

// returns the room name, given a session ID that was associated with it
let findRoomFromSessionId = sessionId => {
  return _.findKey(roomToSessionIdDictionary,  value => { return value === sessionId; });
}

app.get ('/room/:name', (req , res)=> {
  if(!req.params.name){res.status(402).end()}
  let roomName = req.params.name;
  let sessionId;
  let token;
  console.log('attempting to create a session associated with the room: ' + roomName);

  let requesterId = roomName.split("-")[0]
   ticketId = roomName.split("-")[1]

  checkIfValid(ticketId, req).then(response =>{

    //res.send('heel')
    //console.log(res)
   
    //if (response.requester_id == requesterId && req.referer.split("/")[3] === "hc"){
//&& req.headers.origin ==='https://nexmo1443765028.zendesk.com'
    //console.log(req.headers)
      //if (response.requester_id && response.requester_id.toString() === requesterId ){
    if (response && response.toString() === requesterId ){

      if (req.headers.referer.split("/")[3] === "hc"){ updateTicket(ticketId)}
     
  // if the room name is associated with a session ID, fetch that
      if (roomToSessionIdDictionary[roomName]) {
        sessionId = roomToSessionIdDictionary[roomName];
        console.log('Someone requested to join ' + sessionId)
        // generate token
        token = opentok.generateToken(sessionId);
        res.setHeader('Content-Type', 'application/json');
        console.log(token)
        res.send({
          apiKey: apiKey,
          sessionId: sessionId,
          token: token
        });

      }
  // if this is the first time the room is being accessed, create a new session ID
      else {
        opentok.createSession({ mediaMode: 'routed' },  (err, session) => {
          if (err) {
            console.log(err);
            res.status(500).send({ error: 'createSession error:' + err });
            return;
          }
          console.log(session.sessionId + ' has been created')
          // now that the room name has a session associated wit it, store it in memory
          // IMPORTANT: Because this is stored in memory, restarting your server will reset these values
          // if you want to store a room-to-session association in your production application
          // you should use a more persistent storage for them
          roomToSessionIdDictionary[roomName] = session.sessionId;

          // generate token
          token = opentok.generateToken(session.sessionId);
          console.log(token)
          res.setHeader('Content-Type', 'application/json');
           res.send({
            apiKey: apiKey,
            sessionId: session.sessionId,
            token: token
          });
        });
      }
//if abajo
}
//res.statys
else{res.status(404).end()}

})
.catch((e) => {
  //console.log(e)
  res.status(404).end()
})



})

app.post('/archive/start',  (req, res) => {
  var json = req.body;
  var sessionId = json.sessionId;
  opentok.startArchive(sessionId, { name: 'Test' },  (err, archive) => {
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

app.post('/archive/:archiveId/stop',  (req, res) => {
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

app.post('/events',  (req, res) => {
  res.send('OK')
  if(req.body.status === 'uploaded'){
  console.log(req.body)
  //req.body.
  let archiveName = apiKey + "/" + req.body.id + "/archive.mp4"
  //now I would need to do something like
  //downloadFile(archiveName)
  //Handler.downloadVideo(req.body.id + ".mp4", archiveName)
  /*Handler.downloadVideo(req.body.id + ".mp4", archiveName).then(
    
    fs.readdirSync('/Users/jmolinasanz/Desktop/openhack/sample/Archiving').forEach(file => {
      console.log(file);
    }))
    */
    downloadVideo(req.body.id + ".mp4", archiveName, ticketId)
}
})

let checkIfValid = (ticketId, res) => {
  return new Promise(
    (resolve, reject) => {
      client.tickets.show(ticketId, function(err, request, result){
        if (err) reject(err);
          
        //let content = result;
        //let fact = content.requester_id;
        resolve(result.requester_id);

      })
   }
 );
};

  
let updateTicket = (ticketId) => {
    let notification  = 'The ticket requester would like to talk to you.'
 client.tickets.update(ticketId, {"ticket":{comment:{"body": notification, "public": false}}}, (err, req, res) => {
                     if(!err){console.log('Ticket updated')
                      
                   }}
                 )}

let downloadVideo = (archiveName, Key, ticketId) => {

  var fileStream = fs.createWriteStream(archiveName);
  s3 = new AWS.S3({apiVersion: '2020-06-11'});
  var s3Stream = s3.getObject({Bucket: 'zendeskopentok', Key: Key}).createReadStream();

  // Listen for errors returned by the service
  s3Stream.on('error', function(err) {
      // NoSuchKey: The specified key does not exist
      console.error(err);
  });

  s3Stream.pipe(fileStream).on('error', function(err) {
      // capture any errors that occur when writing data to the file
      console.error('File Stream:', err);
  }).on('close', function() {
      console.log('Done.');
      getToken(archiveName, ticketId)
  });

}

let getToken = (archiveName, ticketId) => {
  client.attachments.upload("/Users/jmolinasanz/Desktop/openhack/sample/Archiving/" + archiveName , {binary: false, filename: archiveName}, (err, req, result) => {
    if (err) {
      console.log("error:", err);
      return;
    }
    console.log("token:", result.upload.token);
    uploadVideo(result.upload.token, ticketId)
    //console.log("req:", req);
  })
}

let uploadVideo = (token, ticketId) =>{

  var ticket = {
  "ticket":
    {
      "comment": {
        "body": "This is the recording of the call",
        "public":true,
        "uploads":[token]
      },

    }
  };
  client.tickets.update(ticketId,ticket, (err, req, res) => {
    if(!err){
      console.log(req)
    }
  })

}


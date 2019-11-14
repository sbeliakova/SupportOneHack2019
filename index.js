var express = require('express');
var bodyParser = require('body-parser');
var OpenTok = require('opentok');
var ejs = require('ejs');
var app = express();

var opentok;
var apiKey = '46264952';
var apiSecret = 'ffd4cc1e70268654be554f3ea91ee37e972612ef';

// Verify that the API Key and API Secret are defined
if (!apiKey || !apiSecret) {
  console.log('You must specify API_KEY and API_SECRET environment variables');
  process.exit(1);
}

// Initialize the express app
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);

// Public folder setup
app.use(express.static(__dirname + '/public'));

// Starts the express app
function init() {
  app.listen(3000, function () {
    console.log('You\'re app is now ready at http://localhost:3000/');
  });
}

// Initialize OpenTok
opentok = new OpenTok(apiKey, apiSecret);

// Create a session and store it in the express app
opentok.createSession({ mediaMode: 'routed' }, function (err, session) {
  if (err) throw err;
  app.set('sessionId', session.sessionId);
  app.set('layout', 'horizontalPresentation');
  // We will wait on starting the app until this is done
  init();
});

app.get('/', function (req, res) {
  res.render('hello.html');
});

app.get('/video/:id', function (req, res) {
    let id = req.params;
    res.render('index.html');
  });

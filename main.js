$(function() {
  var client = ZAFClient.init();
  client.invoke('resize', { width: '100%', height: '79vh'  });

  client.get('ticket.requester.id').then(
    function(data) {
      var user_id = data['ticket.requester.id'];
      requestUserInfo(client, user_id);
    }
  );

});


function requestUserInfo(client, id) {
  var settings = {
    url: '/api/v2/users/' + id + '.json',
    type:'GET',
    dataType: 'json',
  };

  client.request(settings).then(
    function(data) {
      showInfo(data);
    },
    function(response) {
      showError(response);
    }
  );
}


function showInfo(data) {
  var requester_data = {
    'name': data.user.name,
    'tags': data.user.tags,
    'created_at': formatDate(data.user.created_at),
    'last_login_at': formatDate(data.user.last_login_at)
  };

  var source = $("#requester-template").html();
  var template = Handlebars.compile(source);
  var html = template(requester_data);
  $("#content").html(html);
}


function showError(response) {
  var error_data = {
    'status': response.status,
    'statusText': response.statusText
  };
  var source = $("#error-template").html();
  var template = Handlebars.compile(source);
  var html = template(error_data);
  $("#content").html(html);
}


function formatDate(date) {
  var cdate = new Date(date);
  var options = {
    year: "numeric",
    month: "short",
    day: "numeric"
  };
  date = cdate.toLocaleDateString("en-us", options);
  return date;
}


var SERVER_BASE_URL = 'http://930eee5f.ngrok.io';
var apiKey;
var sessionId;
var publisher;
var session;
var token;
var publishing = false;
var archiveId;


function backupsetPublishing( type) {
  var stopButton = document.getElementById("stopPublishingId");  
  var startVideoButton = document.getElementById("startPublishingVideoId");
  var startScreenButton = document.getElementById("startPublishingScreenId");
  var startRecordingButton = document.getElementById('startRecordingId');
  var stopRecordingButton = document.getElementById('stopRecordingId');
  if( type == 'screen' ) {
    stopButton.disabled = false;
    startVideoButton.disabled = false;
    startScreenButton.disabled = true;

    startRecordingButton.disabled=false;
    stopRecordingButton.disabled=true;


  } else if( type == 'camera') {
    stopButton.disabled = false;
    startVideoButton.disabled = true;
    startScreenButton.disabled = false;

    startRecordingButton.disabled=false;
    stopRecordingButton.disabled=true;
        
  } else {
    stopButton.disabled = true;
    startVideoButton.disabled = false;
    startScreenButton.disabled = false;

    startRecordingButton.disabled=true;
    stopRecordingButton.disabled=true;

  }
}

function setPublishing( type) {
  var stopButton = document.getElementById("stopPublishingId");  
  var startVideoButton = document.getElementById("startPublishingVideoId");
  var startScreenButton = document.getElementById("startPublishingScreenId");
  var startRecordingButton = document.getElementById('startRecordingId');
  var stopRecordingButton = document.getElementById('stopRecordingId');
  if( type == 'screen' ) {
    // stopButton.style.display = 'none';
    startVideoButton.disabled = false;
    // startScreenButton.style.display = 'inline-block';

    startRecordingButton.disabled=false;
    stopRecordingButton.disabled=true;


  } else if( type == 'camera') {
    stopButton.disabled = false;
    startVideoButton.disabled = true;
    startScreenButton.disabled = false;

    startRecordingButton.disabled=false;
    stopRecordingButton.disabled=true;
        
  } else {
    stopButton.disabled = true;
    startVideoButton.disabled = false;
    startScreenButton.disabled = false;

    startRecordingButton.disabled=true;
    stopRecordingButton.disabled=true;

  }
}

function startRecording() {
  startArchive();
  setRecording( true );
}

function stopRecording() {
  stopArchive();
  setRecording( false );
}

function setRecording( on ) {
  var startRecordingButton = document.getElementById('startRecordingId');
  var stopRecordingButton = document.getElementById('stopRecordingId');

  
    startRecordingButton.disabled=on;
    stopRecordingButton.disabled=!on;
  
}

setPublishing( false );

  
fetch(SERVER_BASE_URL + '/room/' + '17063148267-784').then(function(res) {
// fetch(SERVER_BASE_URL + '/session').then(function(res) {
  return res.json()
}).then(function(res) {
  apiKey = res.apiKey;
  sessionId = res.sessionId;
  token = res.token;
 // button.addEventListener('click', initializeSession(), true);
   initializeSession();
}).catch(handleError);

function handleError(error) {
  if (error) {
    alert(error.message);
  }

}

function startArchive() {
  //
  console.log('start');
  fetch(SERVER_BASE_URL +'/archive/start', {
    method: 'post',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      'sessionId': sessionId
    })
  })
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    console.log('data from server when starting archiving', data)
  })
  .catch(error => console.log('errror starting archive', error))
}
function stopArchive() {
  //
  console.log('stop')
  console.log('archiveID' + archiveID);
  fetch(SERVER_BASE_URL + '/archive/' + archiveID + '/stop', {
    method: 'post',
    headers: {
      'Content-type': 'application/json'
    }
  })
  .then((response) => {
    return response.json()
  })
  .then((data) => {
    console.log('data from server when stopping archiving', data)
  })
  .catch(error => console.log('errror stopping archive', error))
}

function stopPublishing() {
  publisher.publishAudio(false);
  publisher.publishVideo(false);
  console.log("Unpublishing");
  setPublishing(false);

}

function startPublishingVideo() {
  publisher.publishAudio(true);
  publisher.publishVideo(true);
if( publisher.stream.videoType != 'camera') {
  
    publisher.cycleVideo();

  }

  console.log("publishing camera");
  setPublishing('camera');
}
function startPublishingScreen() {
  session.unpublish(publisher);
  OT.checkScreenSharingCapability(function(response) {
    if(!response.supported || response.extensionRegistered === false) {
      // This browser does not support screen sharing.
    } else if (response.extensionInstalled === false) {
      // Prompt to install the extension.
    } else {
      // Screen sharing is available. Publish the screen.
      publisher = OT.initPublisher('publisher',
        {videoSource: 'screen'},
        function(error) {
          if (error) {
            // Look at error.message to see what went wrong.
          } else {
            session.publish(publisher, function(error) {
              if (error) {
                // Look error.message to see what went wrong.
              }
            });
          }
        }
      );
    }
  });


console.log("publishing screen");
  setPublishing('screen');
}



function initializeSession() {
  

  videos.style.display = 'block';
   session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream once we're publishing
  session.on('streamCreated', function(event) {
    session.subscribe(event.stream, 'subscriber', {
      insertMode: 'append'
    }, handleError);
  });

  session.on('archiveStarted', function (event) {
    archiveID = event.id;
    console.log('ARCHIVE STARTED' + archiveID);
  });  


  // Create a publisher
  publisher = OT.initPublisher('publisher', {
    insertMode: 'append',
    publishVideo: false,
    publishAudio: false
    // videoSource : 'screen'
  }, handleError);

  // Connect to the session
  session.connect(token, function(error) {
    // If the connection is successful, initialize a publisher and publish to the session
    if (error) {
      handleError(error);
    } else {
    session.publish(publisher);
    }
  });
}
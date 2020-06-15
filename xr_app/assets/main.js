 var SERVER_BASE_URL = 'https://23ef75fcb34e.ngrok.io';
var apiKey;
var sessionId;
var publisher;
var session;
var token;
var publishing = false;
var archiveId;
var screenSharing = false;
var archiving = false;
var video = false;

$(function() {
  var client = ZAFClient.init();
  client.invoke('resize', { width: '100%', height: '79vh'  });
  videos.style.display = 'none';
 

  client.get(['ticket.id', 'ticket.requester.id']).then(
    function(data) {
      var user_id = data['ticket.requester.id']
      var  ticket_id = data['ticket.id'];

  fetch(SERVER_BASE_URL + '/room/' + user_id + "-" + ticket_id).then(function(res) {

 
  return res.json()
}).then(function(res) {
  apiKey = res.apiKey;
  sessionId = res.sessionId;
  token = res.token;

   //initializeSession();
}).catch(handleError);

    }
  );

});


function startRecording() {
  archiving ? stopArchive() : startArchive();
  //setRecording( true );
}


//setPublishing( false );


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

function startPublishingVideo() {

  video ? publisher.publishVideo(false) : publisher.publishVideo(true)

}


//check the screen div

function startPublishingScreen() {
  if (screenSharing === true){
         session.unpublish(screenPublisher)
       }
       else{
  OT.checkScreenSharingCapability(function(response) {
    if(!response.supported || response.extensionRegistered === false) {
      // This browser does not support screen sharing.
    } 
     else {
      // Screen sharing is available. Publish the screen.
      screenPublisher = OT.initPublisher('screena',
        {videoSource: 'screen'},
        function(error) {
          if (error) {
            // Look at error.message to see what went wrong.
          } else {
            session.publish(screenPublisher, function(error) {
              if (error) {
                // Look error.message to see what went wrong.
              }
            })
            .on("streamCreated", function(event) {  
              console.log("Publisher started streaming. " + event.stream.videoType)
                if (event.stream.videoType === 'screen'){
                  screenSharing = true;
                  document.getElementById("startPublishingScreenId").innerHTML = 'stop screenShare'
                }
              })
              .on("streamDestroyed", function(event) {
               if (event.stream.videoType === 'screen'){screenSharing = false
              document.getElementById("startPublishingScreenId").innerHTML = 'start screenShare'}
              console.log("Publisher stopped streaming.");
            });
          }
        }
      );
    }
  })
};


console.log("publishing screen");
}





function initializeSession() {
  

  videos.style.display = 'block';
   session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream once we're publishing


  session.on('archiveStarted', function (event) {
    archiveID = event.id;
    archiving = true
    document.getElementById('startRecordingId').innerHTML = 'Stop Archive';
    console.log('ARCHIVE STARTED' + archiveID);
  });  

   session.on('archiveStopped', function (event) {
    archiveID = event.id;
    archiving = false
    document.getElementById('startRecordingId').innerHTML = 'Start Archive';
    console.log('ARCHIVE STOPED' + archiveID);
  });  

  session.on("streamPropertyChanged", function(event) {
              console.log(event.newValue)
             video = event.newValue
             video ? document.getElementById("startPublishingVideoId").innerHTML = 'Turn Video off' : document.getElementById("startPublishingVideoId").innerHTML = 'Turn Video on';
            });

  session.on('streamCreated', function(event) {
    console.log('stream created' + event.stream)
    //if (event.stream.hasVideo === 'true'){
      //document.getElementById("startPublishingVideoId").style.display = "none"
               //event.stream.hasVideo ?  video = true : video = false
    //document.getElementById("startPublishingScreenId").innerHTML = 'stop screenShare'
              //  }
    session.subscribe(event.stream, 'subscriber', {
      insertMode: 'append',

    }, handleError);
  });

  // Create a publisher
  publisher = OT.initPublisher('publisher', {
    insertMode: 'replace',
    publishVideo: false,
    //publishAudio: false
     //videoSource : null
  }, handleError);

  // Connect to the session
  session.connect(token, function(error) {
    // If the connection is successful, initialize a publisher and publish to the session
    if (error) {
      handleError(error);
    } else {
    session.publish(publisher)
    document.getElementById("initiatesession").style.display = "none"
     
    }
  });
}

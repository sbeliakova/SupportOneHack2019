

var session;
var apiKey
function handleError(error) {
  if (error) {
    alert(error.message);
  }}


  var SERVER_BASE_URL = 'https://tokboxpruebita.herokuapp.com';
  //var SERVER_BASE_URL = 'http://localhost:8080';

  //if (button) button.onclick = fetcher;

    //function fetcher(e){
    //e.preventDefault();
  
//}

fetch(SERVER_BASE_URL + '/session').then(function(res) {
  return res.json()
}).then(function(res) {
  apiKey = res.apiKey;
  sessionId = res.sessionId;
  token = res.token;

 // button.addEventListener('click', initializeSession(), true);
  //initializeSession()
}).catch(handleError);

// (optional) add server code here
    
  
function initializeSession() {

  
  

  //buttons.style.display = "none";
 // buttons.style.display = "none";
  videos.style.display = "block";
  //videos.style.display = "block";
  var session = OT.initSession(apiKey, sessionId);
  console.log("Session object created" + session);
  if(session==null){
    console.log("Not able to create session object. You may exit");   
  }
// (optional) add server code here

 session.connect(token, function(error) {
    // If the connection is successful, publish to the session
    if (error) {
      handleError(error);
    } else {
      session.publish(publisher, handleError);
    }
  });

session.on('streamCreated', function(event) {
  session.subscribe(event.stream, 'subscriber', {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  }, handleError);
});

session.on({
connectionCreated: function (event) {
			//As soon as clients call session.connect this is called
			//connection id from connection object
			console.log('Session Connection Created Event: ' + ' connections. Connection Id'+ event.connection);
		}})


function unpublish() {
    session.unpublish(publisher);
  }
 
}

 var publisher = OT.initPublisher('publisher', {
    name: "Importanti ticket",
    style: { nameDisplayMode: "on" },
    insertMode: 'append',
    publishVideo: true,
  // videoSource: 'screen',
    width: '100%',
    height: '100%'
  }, handleError);



 publisher.on({
          accessAllowed: function (event) {
            console.log("accessAllowed: The user has granted access to the camera and mic.");
          },
          accessDenied: function (event) {
            //event.preventDefault();
            console.log("accessDenied: The user has denied access to the camera and mic.");
          },
          streamCreated: function (event) {
            console.log('Publisher streamCreated: The publisher started streaming. Resolution='+event.stream.videoDimensions.width +'x' + event.stream.videoDimensions.height+' Stream Id='+event.stream.streamId);
          },
          streamDestroyed: function (event) {
            if (event.reason === 'mediaStopped') {
              console.log("Publisher streamDestroyed: The publisher stopped streaming. Reason: "+ event.reason);
            } else if (event.reason === 'forceUnpublished') {
              console.log("Publisher streamDestroyed: The publisher stopped streaming. Reason: "+ event.reason);
            } else {
              console.log("Publisher streamDestroyed: The publisher stopped streaming. Reason: "+ event.reason);
            }
          },
          mediaStopped: function (event){
            
          }
      
    });

function apagar (){
  console.log('Letting publisher unpublish if not...');
if(publisher!=null){   
   console.log("Unpublishing....");
   publisher.publishVideo(false)

}}
function rotateCamera(cameraRig, relativeRotation) {
  cameraRig.object3D.rotation.y += relativeRotation;
}

AFRAME.registerComponent('snapturn', {
  init: function () {
    
    var consoleText = document.querySelector('#console');
    var cameraRig = document.querySelector('#cameraRig_1');
    var snapTurned = false;
    
    // check for thumbstick movement events
    this.el.addEventListener('thumbstickmoved', function (evt) {
      if (evt.detail.x == 0) {
        snapTurned = false;
      }
      
      if (snapTurned) {
        return;
      }
      
      if (evt.detail.y > 0.95) {
        consoleText.setAttribute('text', 'value', "DOWN");
        console.log("DOWN");
      }
      if (evt.detail.y < -0.95) {
        consoleText.setAttribute('text', 'value', "UP");
        console.log("UP");
      }
      if (evt.detail.x < -0.95) {
        rotateCamera(cameraRig, 45);
        snapTurned = true;
        
        consoleText.setAttribute('text', 'value', "LEFT");
        console.log("LEFT");
      }
      if (evt.detail.x > 0.95) {
        rotateCamera(cameraRig, -45);
        snapTurned = true;
        
        consoleText.setAttribute('text', 'value', "RIGHT");
        console.log("RIGHT");
      }
    });
    
    // check for thumbstick touch 
    this.el.addEventListener('thumbstickchanged', function() {
      consoleText.setAttribute('text', 'value', "PRESSED");
    });

    console.log("INIT");
  }
});
AFRAME.registerComponent("post-it", {
  schema: {
    text: {type: 'string', default: 'default text'},
  },
  init: function() {
    this.el.setAttribute('text', {value: this.data.text, wrapCount: '15'})
    this.el.setAttribute('material', {color: 'yellow'})
    this.el.setAttribute('geometry', {primitive: 'plane', width: 0.5, height: 0.5})
    //this.el.setAttribute('follower', null)
    this.el.setAttribute('grabbable', 'startButtons: gripdown; endButtons: gripup')
    this.el.setAttribute('class', 'clickable')

    // For testing local changes to post-its.
    this.testModeController = document.querySelector('a-scene').systems['test-mode-controller']
    this.el.addEventListener('click', e => {
      if (this.testModeController.testModeOn) {
        // Setting attribute 'post-it' rather than 'text' so that the data for 'post-it' is updated.
        this.el.setAttribute('post-it', {text: this.data.text + ' ...clicked'})
      } else {
        this.el.object3D.position.y += 0.55
      }
    })
  },
  update: function(oldData) {
    if (this.data.text != oldData.text) {
      this.el.setAttribute('text', {value: this.data.text})
    }
  }
})

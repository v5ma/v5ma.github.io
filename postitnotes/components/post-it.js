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
    this.mode = document.querySelector('a-scene').systems['global-mode']
    this.el.addEventListener('click', e => {
      if (this.mode.destructModeOn) {
        if (!this.taggedForDestruction) {
          this.taggedForDestruction = true
          this.el.setAttribute('follower', null)
          setTimeout(() => this.el.emit('click', e.detail), 100)
        }
      } else if (this.mode.testModeOn) {
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

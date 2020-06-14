AFRAME.registerComponent("widget", {
  // From: https://aframe.io/docs/master/core/entity.html
  // In A-Frame, entities are inherently attached with the position, rotation, and scale components.
  schema: {
    color: {type: 'color'},
    primitive: {type: 'string', default: 'box'},
  },
  init: function() {
    //this.el.setAttribute('material', {color: this.data.color})
    //this.el.setAttribute('geometry', {primitive: this.data.primitive})
    this.el.setAttribute('follower', null)
    this.el.setAttribute('grabbable', 'startButtons: gripdown; endButtons: gripup')
    this.el.setAttribute('class', 'clickable')
    this.el.object3D.scale.set(0.2, 0.24, .33);

    // For testing local changes to widgets.
    this.testModeController = document.querySelector('a-scene').systems['test-mode-controller']
    this.el.addEventListener('click', e => {
      if (this.testModeController.testModeOn) {
        if (Math.random() > 0.5) {
          if (this.data.color == 'red' || this.data.color == 'blue') {
            this.el.setAttribute('widget', {color: Math.random() > 0.5 ? 'yellow' : 'purple'})
          } else {
            this.el.setAttribute('widget', {color: Math.random() > 0.5 ? 'red' : 'blue'})
          }
        } else {
          if (this.data.primitive == 'box' || this.data.primitive == 'tetrahedron') {
            this.el.setAttribute('widget', {primitive: 'octahedron'})
          } else {
            this.el.setAttribute('widget', {primitive: Math.random() > 0.5 ? 'box' : 'tetrahedron'})
          }
        }
      }
    })
  },
  update: function(oldData) {
    if (this.data.color != oldData.color) {
      this.el.setAttribute('material', {color: this.data.color})
      VR_LOG('color: ' + oldData.color + ' => ' + this.data.color)
    }
    if (this.data.primitive != oldData.primitive) {
      this.el.setAttribute('geometry', {primitive: this.data.primitive})
      VR_LOG('primitive: ' + oldData.primitive + ' => ' + this.data.primitive)
    }
  }
})

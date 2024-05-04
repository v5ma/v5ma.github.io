function roundXYZ(p) {
  const x = Math.round(p.x * 100) / 100
  const y = Math.round(p.y * 100) / 100
  const z = Math.round(p.z * 100) / 100
  return {x, y, z}
}
 
AFRAME.registerSystem('persistence', {
  schema: {
    components: {default: []}
  },
  init: function () {
    const firebaseConfig = {
    apiKey: "AIzaSyCV7DV3NlGzY5JKNjGf2jfqawoq1LsA-ME",
    authDomain: "thexrweb.firebaseapp.com",
    databaseURL: "https://thexrweb.firebaseio.com",
    projectId: "thexrweb",
    storageBucket: "thexrweb.appspot.com",
    messagingSenderId: "1040046716711",
    appId: "1:1040046716711:web:3b42bcfce3f21ab37d5b02",
    }
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    
    this.sessionId = Math.floor(Math.random() * (2 ** 32))
    VR_LOG(`this.sessionId = ${this.sessionId}`)

    this.numObjectsPushed = 0

    const components = this.data.components
    this.localObjects = new Map()
    this.dbRef = new Map()
    components.forEach(c => {
      this.localObjects.set(c, new Map())
      this.dbRef.set(c, firebase.database().ref(c))
    })

    const scene = this.el
    VR_LOG(`***** scene.hasLoaded = ${scene.hasLoaded}`)

    // TODO: remove event listeners after handling "one time" events like 'loaded' and
    // 'componentinitialized'.  A 'once' method would be nice....
    scene.addEventListener('loaded', () => {
      // First process any entities from the HTML that are persistable.
      components.forEach(c => {
        const ref = this.dbRef.get(c)
        scene.querySelectorAll(`[${c}]`).forEach(o => {
          const htmlId = o.getAttribute('id')
          if (htmlId) {
            ref.orderByChild('htmlId').equalTo(htmlId).once('value', snapshot => {
              if (snapshot.numChildren() === 0) {
                VR_LOG(`adding hardcoded entity '${htmlId}' to db`)
                const data = {...o.getAttribute(c), htmlId}
                this.persistNewLocalObject(c, o, data)
              } else {
                let data
                snapshot.forEach(child => data = child)
                // TODO: more than one child indicates a problem, but for now we'll just ignore it.

                VR_LOG(`updating hardcoded entity '${htmlId}' from db, key = ${data.key.slice(-3)}`)
                const p = data.val().position
                o.object3D.position.set(p.x, p.y, p.z)
                const r = data.val().rotation
                o.object3D.rotation.set(r.x, r.y, r.z)
                this.registerLocalObject(c, o, data.key)
                o.setAttribute(c, data.val())
              }
            })
          } else {
            VR_LOG(`Local entity with ${c} component found, but isn't persistable without an id`)
          }
        })
      })

      scene.addEventListener('child-attached', e => {
        const el = e.detail.el
        if (el.createdByPersistenceSystem) {
          VR_LOG('ignoring attached child')
          return
        }
        components.forEach(c => {
          if (c in el.components) {
            if (el.hasLoaded) {
              VR_LOG('!!!!!!!!!!!!')
              this.persistNewLocalObject(c, el, el.getAttribute(c))
            } else {
              el.addEventListener('componentinitialized', e => {
                if (e.detail.name == c) {
                  VR_LOG(`'componentinitialized' emitted for ${c}`)
                  this.persistNewLocalObject(c, el, el.getAttribute(c))
                }
              })
            }
          }
        })
      })
      scene.addEventListener('child-detached', e => {
        const el = e.detail.el
        components.forEach(c => {
          if (c in el.components) {
            const key = (() => {
              for (const [key, value] of this.localObjects.get(c).entries()) {
                if (value === el) return key;
              }
            })()
            if (key) {
              VR_LOG(`deleting locally destroyed ${c} from db`)
              this.localObjects.get(c).delete(key)
              this.dbRef.get(c).child(key).remove()
            } else {
              VR_LOG(`couldn't find key for locally destroyed ${c}`)
            }
          }
        })
      })
    })

    components.forEach(c => {
      this.dbRef.get(c).on('child_added', data => {
        const key = data.key
        VR_LOG(`db reports child_added, key = ${key.slice(-3)}`)
        const weAddedThis = data.val().sessionId === this.sessionId
        const isHardCoded = !!data.val().htmlId
        const isRegistered = this.localObjects.get(c).has(key)
        if (!weAddedThis && !isHardCoded && !isRegistered) {
          VR_LOG(`creating local entity, key = ${key.slice(-3)}`)
          const newObj = document.createElement('a-entity')
          newObj.createdByPersistenceSystem = true
          scene.appendChild(newObj)
          newObj.setAttribute(c, data.val())
          const p = data.val().position
          newObj.object3D.position.set(p.x, p.y, p.z)
          const r = data.val().rotation
          newObj.object3D.rotation.set(r.x, r.y, r.z)
          this.registerLocalObject(c, newObj, key)
        }
      })
    })

    components.forEach(c => {
      this.dbRef.get(c).on('child_changed', data => {
        if (data.val().sessionId != this.sessionId) {
          VR_LOG(`db reports child_changed, key = ${data.key.slice(-3)}, sessionId = ${data.val().sessionId}`)
          const obj = this.localObjects.get(c).get(data.key)

          const p = data.val().position
          VR_LOG('p = ' + '{x: ' + p.x + ', y: ' + p.y + ', z: ' + p.z + '}')
          obj.object3D.position.set(p.x, p.y, p.z)
          obj.prevPosition = {...p}
          const r = data.val().rotation
          obj.object3D.rotation.set(r.x, r.y, r.z)
          obj.prevRotation = {x: r.x, y: r.y, z: r.z}

          // TODO: This results in 'componentchanged' being emitted, which results
          // in a call to persistLocalChange(). This is inefficient, and should be avoided,
          // but at least it doesn't cause an infinite loop, because the latter redundant call won't
          // actually change anything.  See notes about 'pending'.
          obj.setAttribute(c, data.val())
        } else {
          //VR_LOG(`child_changed in db, ignoring because sessionId matches current sessionId`)
        }
      })
    })

    components.forEach(c => {
      this.dbRef.get(c).on('child_removed', data => {
        VR_LOG(`db reports child_removed, key = ${data.key}`)
        const obj = this.localObjects.get(c).get(data.key)
        if (obj) {
          this.localObjects.get(c).delete(data.key)
          scene.removeChild(obj)
          VR_LOG('entity removed')
        }
      })
    })

    this.tick = AFRAME.utils.throttleTick(this.tick, 400, this);
  },
  tick: function (t, dt) {
    this.data.components.forEach(c => {
      this.localObjects.get(c).forEach((obj, key) => {
        const p = obj.object3D.position
        const dSq = p.distanceToSquared(obj.prevPosition)

        // We could compute the angle difference using THREE.Quaternion.angleTo(),
        // but that seems like overkill.
        const r = obj.object3D.rotation
        const dRx = Math.abs(r.x - obj.prevRotation.x)
        const dRy = Math.abs(r.y - obj.prevRotation.y)
        const dRz = Math.abs(r.z - obj.prevRotation.z)

        if (dSq > 0.01 || dRx > 0.05 || dRy > 0.05 || dRz > 0.05) {
          VR_LOG(`entity transformation changed, key = ${key.slice(-3)}`)
          this.persistLocalChange(c, key, {
            position: roundXYZ(p),
            rotation: roundXYZ(r)
          })
          obj.prevPosition = {...p}
          obj.prevRotation = {x: r.x, y: r.y, z: r.z}
        }
      })
    })
  },
  persistNewLocalObject: function (componentName, newObj, data) {
    if (this.numObjectsPushed > 20) {
      VR_LOG('@@@@@@@@@@@@@@@@@@@@@@@@')
      return
    }
    this.numObjectsPushed++
    const p = newObj.object3D.position
    const r = newObj.object3D.rotation
    const ref = this.dbRef.get(componentName).push({
      sessionId: this.sessionId,
      position: {...p},
      rotation: {x: r.x, y: r.y, z: r.z},
      ...data
    })
    this.registerLocalObject(componentName, newObj, ref.key)
    VR_LOG(`${componentName} added to db, key = *${ref.key.slice(-3)}`)
  },
  registerLocalObject: function (componentName, obj, key) {
    this.localObjects.get(componentName).set(key, obj)
    obj.dbKey = key
    obj.prevPosition = {...obj.object3D.position}
    const r = obj.object3D.rotation
    obj.prevRotation = {x: r.x, y: r.y, z: r.z}
    VR_LOG(`${componentName} registered`)
    obj.addEventListener('componentchanged', e => {
      if (e.detail.name == componentName) {
        VR_LOG(`entity emitted componentchanged, key = ${key.slice(-3)}`)
        this.persistLocalChange(componentName, key, obj.getAttribute(componentName))
      }
    })
  },
  persistLocalChange: function (componentName, key, data) {
    VR_LOG('persistLocalChange: key = ' + key.slice(-3))
    //for (const k in data) VR_LOG(k)
    const objRef = this.dbRef.get(componentName).child(key)
    objRef.update({
      sessionId: this.sessionId,
      ...data
    })
  },
  destroyAll: function () {
    this.data.components.forEach(c => {
      this.dbRef.get(c).remove()
    })
  }
})

// Not currently using this, because the object-destroyer can be used in test mode to
// destroy everything (in a more picturesque way).
AFRAME.registerComponent("persistent-object-destroyer", {
  init: function() {
    this.persistenceSystem = document.querySelector('a-scene').systems['persistence']
    this.el.addEventListener('click', e => {
      VR_LOG('destroyer clicked')
      this.persistenceSystem.destroyAll()
    })
  }
})

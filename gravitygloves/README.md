# aframe-gravity-gloves-component
The Gravity Gloves enables you to point at an object that you want, click on it, then it flies in an upward arc towards your hand where you can grip it with the grip button, where it gains physics. So you can throw it or drop it. When you call an object/entity it temporarily loses its dynamic body and then gains it again.

The new minimal code example was just uploaded and the other examples were moved to the new examples folder.

This Gravity Gloves Component example view at https://n5ro.github.io/gravitygloves/ is combined

The installation requires Super-Hands, Aframe Extras, Aframe Physics System, Aframe Event Set Component, Aframe Curve Component, Aframe Along Path component, and Laser Controls.
    <script src="https://aframe.io/releases/1.0.4/aframe.min.js"></script>
    <script src="https://unpkg.com/super-hands/dist/super-hands.min.js"></script> 
    <script src="https://cdn.rawgit.com/donmccurdy/aframe-extras/v4.1.2/dist/aframe-extras.min.js"></script>
    <script src="https://cdn.rawgit.com/donmccurdy/aframe-physics-system/v4.0.1/dist/aframe-physics-system.min.js"></script>
    <script src="https://unpkg.com/aframe-event-set-component@5.0.0/dist/aframe-event-set-component.min.js"></script>
    <script src="https://rawgit.com/protyze/aframe-curve-component/master/dist/aframe-curve-component.min.js"></script>
    <script src="https://rawgit.com/protyze/aframe-alongpath-component/master/dist/aframe-alongpath-component.min.js"></script>
    
There is a curve entity with 5 curve points to generate a path for each called entity to follow.
There is a gravity mixin to add to each entity that you want to be accessible to the gravity gloves (or your cursor)
The gravity component is actually a follower component that tells an object what to do when clicked on with your cursor. So you need to add the follower component to your entities. (Its in the gravity mixin in our index example)

We want to create a future version with Ammo.js, but it's a work in progress, I do not have a working version yet with Ammo. Ammo is a bigger and more frequently updated physics library, in addition to static and dynamic bodies it also has kinematic bodies and other features.

The controller adapter component exists to make Windows Mixed Reality devices compatible.

This component was the combined effort of the Aframe WebXR Online Hacknight over 6 weeks. https://www.meetup.com/virtualreality/events/

Here is the previous version with sticks https://n5ro.github.io/gravitygloves/examples/sticks.html
The Sticks.html example features the 6 balls on the ground, and the sticks were inspired and remixed from this super hands physics demo https://wmurphyrd.github.io/aframe-super-hands-component/examples/sticky/

No physics version that is just pulling an entity to your hand.
https://n5ro.github.io/gravitygloves/examples/nophysics.html

There is a version that offsets the arrival point to your hand by the radius of the bounding sphere of the object. It's been renamed to radialoffset.html That version is actually what's in the index.html code, but we plan to change it to a world position offset so we can pick what point on the entity mesh that arrives to the hand.
https://n5ro.github.io/gravitygloves/examples/radialoffset.html


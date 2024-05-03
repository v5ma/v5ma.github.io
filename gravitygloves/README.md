# A-Frame Gravity Gloves Component

The A-Frame Gravity Gloves Component is an exciting addition to the A-Frame VR framework, enabling intuitive object interaction and manipulation in virtual reality experiences. With the Gravity Gloves, you can point at an object, click on it, and watch as it flies towards your hand in a captivating upward arc. Once the object reaches your hand, you can grip it using the grip button, and it gains realistic physics properties, allowing you to throw or drop it naturally.

## Features

- Point-and-click object selection: Simply point at an object and click to select it.
- Gravity-defying object movement: Selected objects fly towards your hand in a mesmerizing upward arc.
- Physics-based interaction: Gripped objects gain physics properties, enabling realistic throwing and dropping.
- Temporary physics suspension: During the object's flight towards your hand, its dynamic body is temporarily suspended, ensuring smooth movement.
- Customizable curve path: Define the flight path of objects using a curve entity with multiple curve points.
- Compatibility with various VR devices: The component includes a controller adapter to ensure compatibility with Windows Mixed Reality devices.

## Installation

To use the A-Frame Gravity Gloves Component in your project, you'll need to include the following dependencies:

```html
<script src="https://aframe.io/releases/1.0.4/aframe.min.js"></script>
<script src="https://unpkg.com/super-hands/dist/super-hands.min.js"></script>
<script src="https://cdn.rawgit.com/donmccurdy/aframe-extras/v4.1.2/dist/aframe-extras.min.js"></script>
<script src="https://cdn.rawgit.com/donmccurdy/aframe-physics-system/v4.0.1/dist/aframe-physics-system.min.js"></script>
<script src="https://unpkg.com/aframe-event-set-component@5.0.0/dist/aframe-event-set-component.min.js"></script>
<script src="https://rawgit.com/protyze/aframe-curve-component/master/dist/aframe-curve-component.min.js"></script>
<script src="https://rawgit.com/protyze/aframe-alongpath-component/master/dist/aframe-alongpath-component.min.js"></script>
```

Make sure to include the Gravity Gloves Component script after the dependencies:

```html
<script src="path/to/aframe-gravity-gloves-component.js"></script>
```

## Usage

To enable the Gravity Gloves functionality for an entity, you need to add the `follower` component to it. The `follower` component tells an object what to do when clicked on with your cursor.

Here's an example of how to add the `follower` component to an entity:

```html
<a-entity geometry="primitive: box" material="color: red" follower></a-entity>
```

You can also define a `gravity` mixin that includes the necessary components and properties for entities that you want to be accessible to the Gravity Gloves:

```html
<a-mixin id="gravity" dynamic-body follower></a-mixin>
```

Then, you can apply the mixin to your entities:

```html
<a-entity geometry="primitive: sphere" material="color: blue" mixin="gravity"></a-entity>
```

To define the flight path of objects, you need to create a curve entity with multiple curve points. Here's an example:

```html
<a-entity id="curve">
  <a-curve-point position="-1 1 -3"></a-curve-point>
  <a-curve-point position="0 2 -3"></a-curve-point>
  <a-curve-point position="1 1 -3"></a-curve-point>
</a-entity>
```

## Examples

### Basic Example

Check out the [basic example](https://v5ma.github.io/gravitygloves/) to see the Gravity Gloves Component in action. This example showcases the essential features of the component.

### Sticks Example

The [sticks example](https://v5ma.github.io/gravitygloves/examples/sticks.html) demonstrates the Gravity Gloves interacting with a scene containing six balls on the ground and sticks. This example is inspired by and remixed from the [Super Hands Physics Demo](https://wmurphyrd.github.io/aframe-super-hands-component/examples/sticky/).

### No Physics Example

For a simplified version without physics, check out the [no physics example](https://v5ma.github.io/gravitygloves/examples/nophysics.html). In this example, entities are simply pulled towards your hand without any physics simulation.

### Radial Offset Example

The [radial offset example](https://v5ma.github.io/gravitygloves/examples/radialoffset.html) showcases a version where the arrival point of objects is offset by the radius of their bounding sphere. This ensures that objects arrive at a consistent distance from your hand.

## Community and Support

The A-Frame Gravity Gloves Component is a result of the collaborative efforts of the A-Frame WebXR Online Hacknight community. We would like to express our gratitude to all the participants who contributed to this project over the course of six weeks.

If you have any questions, suggestions, or want to get involved in the development of the Gravity Gloves Component, please join us at the [A-Frame WebXR Online Hacknight](https://www.meetup.com/virtualreality/events/).

We appreciate your interest and support in making the Gravity Gloves Component even better!

Happy gravity glove interactions in your A-Frame VR experiences!


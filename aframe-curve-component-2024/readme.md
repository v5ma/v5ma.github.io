# A-Frame Curve Component 2024

The A-Frame Curve Component 2024 is a versatile tool for creating and manipulating curves in your A-Frame scenes. It allows you to define curves using a set of control points and provides functionality to render the curves as lines and clone entities along the curve path.

## Overview

The Curve Component consists of several sub-components and primitives that work together to create and visualize curves in A-Frame:

- `curve` component: Defines the curve using a set of control points and curve properties.
- `curve-point` component: Represents a control point of the curve.
- `draw-curve` component: Renders the curve as a line in the scene.
- `clone-along-curve` component: Clones entities along the curve path.
- `a-curve` primitive: A convenience primitive for creating curves.
- `a-curve-point` primitive: A convenience primitive for creating curve points.

This documentation covers the updated version of the Curve Component, which is compatible with A-Frame 1.5.0 and uses BufferGeometry instead of the deprecated Geometry from Three.js.

## Usage

To use the Curve Component in your A-Frame scene, follow these steps:

1. Include the `curve3May2024.js` script in your HTML file:

```html
<script src="https://cdn.jsdelivr.net/gh/v5ma/v5ma.github.io@master/aframe-curve-component-2024/curve3May2024.js"></script>
```

Make sure to use the correct and updated CDN link to ensure you are fetching the latest version of the `curve3May2024.js` file.

2. Define the curve using the `a-curve` primitive:

```html
<a-curve id="my-curve">
  <!-- Curve points will be added here -->
</a-curve>
```

- The `id` attribute assigns a unique identifier to the curve, which can be used for referencing the curve in other components.

3. Add curve points to define the shape of the curve using the `a-curve-point` primitive:

```html
<a-curve id="my-curve">
  <a-curve-point position="-1 1 -3" curve-id="curve1"></a-curve-point>
  <a-curve-point position="0 2 -3" curve-id="curve1"></a-curve-point>
  <a-curve-point position="1 1 -3" curve-id="curve1"></a-curve-point>
</a-curve>
```

- Each `a-curve-point` primitive represents a control point of the curve.
- The `position` attribute specifies the position of the curve point in 3D space.
- The `curve-id` attribute is used to associate the curve point with a specific set of curve points.
- The `a-curve-point` primitives should be added as children of the `a-curve` primitive.

4. Render the curve as a line in the scene using the `draw-curve` component:

```html
<a-entity draw-curve="curve: #my-curve"></a-entity>
```

- The `curve` attribute specifies the selector of the curve entity to be rendered.

5. Clone entities along the curve path using the `clone-along-curve` component:

```html
<a-box width="0.1" height="0.1" depth="0.1" color="yellow" clone-along-curve="curve: #my-curve; spacing: 0.2;"></a-box>
```

- The `curve` attribute specifies the selector of the curve entity along which the entities will be cloned.
- The `spacing` attribute determines the distance between each cloned entity along the curve path.

## API

### `curve` Component

| Property | Description                                                                                    | Default Value |
|----------|------------------------------------------------------------------------------------------------|---------------|
| type     | Type of the curve to draw. One of: 'CatmullRom', 'CubicBezier', 'QuadraticBezier', 'Line'     | 'CatmullRom'  |
| closed   | Whether or not the curve should be drawn closed (connect the end and start point automatically)| false         |

### `curve-point` Component

| Property | Description                                                    | Default Value |
|----------|----------------------------------------------------------------|---------------|
| position | The position of the curve point in 3D space                    | '0 0 0'       |
| curve-id | The identifier associating the curve point with a specific set | ''            |

### `draw-curve` Component

| Property | Description                                          | Default Value |
|----------|------------------------------------------------------|---------------|
| curve    | A selector to identify the corresponding curve entity| ''            |

### `clone-along-curve` Component

| Property | Description                                            | Default Value |
|----------|--------------------------------------------------------|---------------|
| curve    | A selector to identify the corresponding curve entity  | ''            |
| spacing  | Spacing between the cloned entities in meters          | 1             |
| rotation | Rotation of the cloned entities                        | '0 0 0'       |
| scale    | Scale of the cloned entities                           | '1 1 1'       |

## Simplified Example

Here's a simplified example that demonstrates the usage of the Curve Component:

```html
<a-scene>
  <!-- Define the curve -->
  <a-curve id="my-curve">
    <a-curve-point position="-1 1 -3" curve-id="curve1"></a-curve-point>
    <a-curve-point position="0 2 -3" curve-id="curve1"></a-curve-point>
    <a-curve-point position="1 1 -3" curve-id="curve1"></a-curve-point>
  </a-curve>

  <!-- Render the curve as a line -->
  <a-entity draw-curve="curve: #my-curve"></a-entity>

  <!-- Clone entities along the curve -->
  <a-box width="0.1" height="0.1" depth="0.1" color="yellow" clone-along-curve="curve: #my-curve; spacing: 0.2;"></a-box>
</a-scene>
```

In this example:

1. The curve is defined using the `a-curve` primitive with the `id` of "my-curve".

2. Curve points are added using the `a-curve-point` primitives, each with a `position` attribute defining its position in 3D space and a `curve-id` attribute associating it with a specific set of curve points.

3. The `draw-curve` component is used to render the curve as a line in the scene, referencing the curve using the `curve` attribute.

4. The `clone-along-curve` component is used to clone `a-box` entities along the curve path, with a spacing of 0.2 units between each cloned entity.

## Advanced Usage

### Multiple Sets of Curve Points

The Curve Component allows you to define multiple sets of curve points within a single `a-curve` primitive. Each set of curve points can be associated with a different `curve-id` attribute. This enables you to draw curves based on specific sets of points or combine multiple sets of points.

```html
<a-curve id="my-curve">
  <!-- Curve points for curve1 -->
  <a-curve-point position="-1 1 -3" curve-id="curve1"></a-curve-point>
  <a-curve-point position="0 2 -3" curve-id="curve1"></a-curve-point>
  <a-curve-point position="1 1 -3" curve-id="curve1"></a-curve-point>

  <!-- Curve points for curve2 -->
  <a-curve-point position="-2 0 -4" curve-id="curve2"></a-curve-point>
  <a-curve-point position="-1 1 -4" curve-id="curve2"></a-curve-point>
  <a-curve-point position="0 0 -4" curve-id="curve2"></a-curve-point>
</a-curve>
```

With this structure, you can draw curves based on specific sets of curve points or combine multiple sets of points in a single `draw-curve` entity:

```html
<!-- Draw a curve using only the points with curve-id "curve1" -->
<a-entity draw-curve="curve: #my-curve[curve-id='curve1']" material="color: blue;"></a-entity>

<!-- Draw a curve using only the points with curve-id "curve2" -->
<a-entity draw-curve="curve: #my-curve[curve-id='curve2']" material="color: green;"></a-entity>

<!-- Draw a curve using both sets of points (curve1 and curve2) -->
<a-entity draw-curve="curve: #my-curve" material="color: red;"></a-entity>
```

### Follower Component

The Curve Component is used in conjunction with the follower component in the A-Frame Gravity Gloves example. The follower component allows an entity to follow a specific set of curve points dynamically.

```html
<a-entity follower="curve: #my-curve[curve-id='curve1']"></a-entity>
```

You can switch the follower component to follow a different set of curve points by updating the `curve` attribute dynamically using JavaScript:

```javascript
document.querySelector('[follower]').setAttribute('follower', 'curve', '#my-curve[curve-id="curve2"]');
```

This way, you can easily switch the follower component to follow different sets of curve points stored under a single `a-curve` primitive, providing flexibility and dynamic control over the behavior of the follower in your A-Frame application.

### Curve Types

The Curve Component supports different types of curves, which can be specified using the `type` property of the `curve` component. The available curve types are:

- `CatmullRom` (default): Creates a smooth curve that passes through all the control points.
- `CubicBezier`: Creates a cubic Bezier curve based on four control points.
- `QuadraticBezier`: Creates a quadratic Bezier curve based on three control points.
- `Line`: Creates a straight line between two control points.

Here's an example of defining a curve with a specific type:

```html
<a-curve id="my-curve" type="CubicBezier">
  <a-curve-point position="-1 1 -3"></a-curve-point>
  <a-curve-point position="-0.5 2 -3"></a-curve-point>
  <a-curve-point position="0.5 2 -3"></a-curve-point>
  <a-curve-point position="1 1 -3"></a-curve-point>
</a-curve>
```

### Closed Curves

To create a closed curve, set the `closed` property of the `curve` component to `true`. This will automatically connect the end point of the curve with the start point.

```html
<a-curve id="my-curve" closed="true">
  <a-curve-point position="-1 1 -3"></a-curve-point>
  <a-curve-point position="0 2 -3"></a-curve-point>
  <a-curve-point position="1 1 -3"></a-curve-point>
</a-curve>
```

### Customizing Line Appearance

The appearance of the rendered curve line can be customized using A-Frame's material system. You can set the `material` attribute on the `draw-curve` component to specify the desired material properties.

```html
<a-entity draw-curve="curve: #my-curve" material="shader: line; color: blue; opacity: 0.7;"></a-entity>
```

### Cloning Entities along Multiple Curves

The `clone-along-curve` component can be used to clone entities along multiple curves by specifying the curve selectors separated by commas.

```html
<a-box clone-along-curve="curve: #curve1, #curve2; spacing: 0.2;"></a-box>
```

In this example, the `a-box` entity will be cloned along both `#curve1` and `#curve2` with a spacing of 0.2 units.

## Events

The Curve Component emits the following event:

- `curve-updated`: Emitted by the `curve` component whenever the curve is updated due to changes in the curve points or curve properties.

You can listen for this event to perform actions or update other components when the curve is modified. For example:

```javascript
document.querySelector('#my-curve').addEventListener('curve-updated', function () {
  console.log('Curve updated!');
  // Perform actions or update other components
});
```

## Compatibility

The A-Frame Curve Component is compatible with A-Frame version 1.5.0 and above. It has been tested with the latest versions of modern web browsers, including Chrome, Firefox, Safari, and Edge.

## Credits

The initial concept and development of the A-Frame Curve Component were done by AdaRoseEdwards. The current version has been updated and maintained by the A-Frame community.

## License

The A-Frame Curve Component is released under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute it as per the terms of the license.

## Conclusion

The A-Frame Curve Component provides a powerful and flexible way to create and manipulate curves in your A-Frame scenes. With its intuitive primitives and components, you can easily define curves, render them as lines, and clone entities along the curve path.

The ability to define multiple sets of curve points within a single `a-curve` primitive and associate them with different `curve-id` attributes opens up possibilities for dynamic and interactive experiences. The follower component, as demonstrated in the A-Frame Gravity Gloves example, showcases how entities can follow specific sets of curve points dynamically.

Whether you're creating paths for animations, generating procedural content, or adding visual interest to your scenes, the Curve Component offers a range of possibilities. Experiment with different curve types, customize the appearance of the curve and cloned entities, and leverage the `curve-updated` event to create interactive and dynamic experiences.

We hope this documentation has provided you with a comprehensive understanding of the Curve Component and how to use it effectively in your A-Frame projects. Happy curve creation!

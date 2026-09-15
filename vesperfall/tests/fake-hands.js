/* TEST ONLY. Extends fake-xr.js with articulated input sources and real frame
 * joint APIs. It does not touch gameplay state or bypass menu callbacks. */
(() => {
  const savedRequest = navigator.xr.requestSession.bind(navigator.xr);
  const state = {controllers: null, distance: {left: .05, right: .05}, missing: new Set(), options: null, enabled: false};
  const names = ['wrist', 'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'];
  for (const name of ['index-finger', 'middle-finger', 'ring-finger', 'pinky-finger'])
    for (const part of ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip']) names.push(name + '-' + part);
  navigator.xr.requestSession = async (mode, options) => {
    state.options = options;
    const session = await savedRequest(mode, options), request = session.requestAnimationFrame.bind(session);
    session.requestAnimationFrame = callback => request((t, frame) => {
      frame.getJointPose = (space, ref) => {
        if (state.missing.has(space.hand + ':' + space.joint)) return null;
        const pose = frame.getPose(space, ref); if (!pose) return null;
        const transform = {...pose.transform, position: {...pose.transform.position}, matrix: new Float32Array(pose.transform.matrix)};
        if (space.joint === 'thumb-tip') transform.position.x += state.distance[space.hand];
        transform.matrix[12] = transform.position.x;
        return {transform, radius: .008, emulatedPosition: false};
      };
      callback(t, frame);
    });
    return session;
  };
  window.TestHands = {
    state,
    mode(on) {
      const session = TestXR.state.session, old = session.inputSources;
      if (on) {
        state.controllers = old;
        session.inputSources = ['left', 'right'].map(side => ({handedness: side, targetRayMode: 'tracked-pointer',
          profiles: ['generic-hand-select'], targetRaySpace: {hand: side},
          hand: new Map(names.map(joint => [joint, {hand: side, joint}]))}));
      } else {
        session.inputSources = state.controllers;
        for (const source of session.inputSources) for (const b of source.gamepad.buttons) Object.assign(b, {pressed: false, touched: false, value: 0});
      }
      state.enabled = on;
      const event = new Event('inputsourceschange'); event.removed = old; event.added = session.inputSources; session.dispatchEvent(event);
    },
    pinch(side, distance) { state.distance[side] = distance; },
    missing(side, joint, on) { const key = side + ':' + joint; if (on) state.missing.add(key); else state.missing.delete(key); }
  };
})();

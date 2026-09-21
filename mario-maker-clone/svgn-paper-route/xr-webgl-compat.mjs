/* Pinned Three r177 WebGL compatibility. Browser-owned XRWebGLLayer
 * attachments must never be replaced. Normal and projection targets delegate.
 * https://www.w3.org/TR/webxr/#opaque-framebuffer
 */
export function protectOpaqueXRFramebuffer(renderer) {
  const backend = renderer?.backend;
  if (!backend?.isWebGLBackend || typeof backend._setFramebuffer !== 'function') {
    throw new Error('The pinned WebGL XR backend is unavailable');
  }
  const original = backend._setFramebuffer;
  function bind(descriptor) {
    const target = descriptor.renderTarget;
    if (descriptor.textures !== null && target?.isXRRenderTarget === true &&
        target.hasExternalTextures !== true && target.samples === 0 &&
        backend._xrFramebuffer != null) {
      backend.state.bindFramebuffer(backend.gl.FRAMEBUFFER, backend._xrFramebuffer);
      return;
    }
    return original.call(this, descriptor);
  }
  backend._setFramebuffer = bind;
  // r177 can end an accepted session before its first frame allocates this target.
  // Keep its normal reset/disposal path unless that target is explicitly null.
  const originalReset = renderer._resetXRState;
  function resetXRState(...args) {
    if (this._frameBufferTarget !== null) return originalReset.apply(this, args);
    this.backend.setXRTarget(null);
    this.setOutputRenderTarget(null);
    this.setRenderTarget(null);
  }
  if (typeof originalReset === 'function') renderer._resetXRState = resetXRState;
  return () => {
    if (backend._setFramebuffer === bind) backend._setFramebuffer = original;
    if (renderer._resetXRState === resetXRState) renderer._resetXRState = originalReset;
  };
}

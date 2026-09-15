/* Fully opaque UI in Three's last transparent group: scenery must not paint over it.
 * Opaque and transparent lists sort independently, including group order.
 * This is a presentation layer, not an XR device or input adapter.
 */
export const PANEL_ORDER=100000, POINTER_ORDER=100001;
export function addOverlay(T,parent,mesh,order=PANEL_ORDER){
 if(!parent?.add||!mesh?.material||!Number.isFinite(order))throw new TypeError('Overlay requires a parent, mesh and finite order');
 const layer=new T.Group();layer.name='Sky Cycle XR overlay';layer.renderOrder=order;
 Object.assign(mesh.material,{transparent:true,opacity:1,depthTest:false,depthWrite:false,fog:false,toneMapped:false});
 mesh.renderOrder=order;mesh.frustumCulled=false;layer.add(mesh);parent.add(layer);return layer;
}

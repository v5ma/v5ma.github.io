/* Original Rainward art calibration, not anthropometric or mocap ground truth.
 * Apply the SAME rest-space map to garments, imported detail and joint bind
 * points. Runtime GLB derivatives are cloned; the licensed originals stay intact. */
const lerp=(a,b,t)=>a+(b-a)*t;
function curve(y,points){for(let i=1;i<points.length;i++)if(y<=points[i][0]){const a=points[i-1],b=points[i];return lerp(a[1],b[1],Math.max(0,(y-a[0])/(b[0]-a[0])));}return points.at(-1)[1];}
const widths=[[0,.96],[.2,.98],[.8,1],[1.1,.99],[1.35,.94],[1.48,.97],[1.52,1],[2,1]];
const kneeOffset=[[0,0],[.105,0],[.49,.012],[.92,0],[2,0]];
const depths=[[0,.94],[.17,.94],[.25,1],[2,1]];
export function proportionPoint(x,y,z){return [x*curve(y,widths),y+curve(y,kneeOffset),z*curve(y,depths)];}
export function fitProportions(geometry){
 if(geometry.userData.rainwardProportions)return geometry;
 const p=geometry.attributes.position,n=geometry.attributes.normal,eps=1e-4;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v=proportionPoint(x,y,z),a=proportionPoint(x,y-eps,z),b=proportionPoint(x,y+eps,z);
  if(n){const wx=curve(y,widths),wz=curve(y,depths),dy=(b[1]-a[1])/(2*eps),nx=n.getX(i)/wx,nz=n.getZ(i)/wz,ny=(n.getY(i)-(b[0]-a[0])/(2*eps)*nx-(b[2]-a[2])/(2*eps)*nz)/dy,len=Math.hypot(nx,ny,nz)||1;n.setXYZ(i,nx/len,ny/len,nz/len);}
  p.setXYZ(i,...v);
 }
 p.needsUpdate=true;if(n)n.needsUpdate=true;geometry.computeBoundingSphere();geometry.computeBoundingBox();geometry.userData.rainwardProportions=true;return geometry;
}

// Limit short interaction readouts, not physical architecture, in screen space.
export function readoutScale({depth,width,height,parentScale=1,viewportHeight,fov=58,maxHeight=64,maxWidth=260}){
 const values=[depth,width,height,parentScale,viewportHeight,fov,maxHeight,maxWidth];
 if(values.some(n=>!Number.isFinite(n)||n<=0)||fov>=179)return 1;
 const worldPerPixel=2*depth*Math.tan(fov*Math.PI/360)/viewportHeight;
 return Math.min(1,worldPerPixel*maxHeight/(height*parentScale),worldPerPixel*maxWidth/(width*parentScale));
}

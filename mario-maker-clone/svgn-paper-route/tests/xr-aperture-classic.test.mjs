import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.webgpu.js';
import {createWorldAperture} from '../xr-world-aperture.mjs';
test('Classic game material masks pass through r177 conversion and leave no extra field after exit',()=>{
 const scene=new T.Scene(),material=new T.MeshBasicMaterial(),aperture=createWorldAperture(T);
 scene.add(new T.Mesh(new T.BoxGeometry(),material));assert(!Object.hasOwn(material,'maskNode'));
 aperture.update(new T.Matrix4(),{},true);aperture.sync(scene);
 assert(material.maskNode?.isNode);assert(Object.keys(material).includes('maskNode'));
 const nodeMaterial=new T.MeshBasicNodeMaterial();for(const key in material)nodeMaterial[key]=material[key];
 assert.equal(nodeMaterial.maskNode,material.maskNode);aperture.dispose();
 assert(!Object.hasOwn(material,'maskNode'));assert.equal(aperture.diagnostics.materials,0);
});

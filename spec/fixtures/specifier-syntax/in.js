import * as THREE from 'three';
export {default as GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

console.log(THREE);

await import('~/polyfills/navigator.userAgentData.js');
const moduleSpecifier = '~/polyfills/navigator.userAgentData.js';
await import(moduleSpecifier);

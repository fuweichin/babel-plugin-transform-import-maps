import * as THREE from '/node_modules/three/build/three.module.js';
export { default as GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';

console.log(THREE);

await import('//mysite.com/packages/myapp/polyfills/navigator.userAgentData.js');
const moduleSpecifier = '~/polyfills/navigator.userAgentData.js';
await import(moduleSpecifier);

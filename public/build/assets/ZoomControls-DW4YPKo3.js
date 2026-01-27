import{j as e}from"./app-DpMKA5IA.js";import{B as o}from"./button-BptkRQla.js";import{C as r}from"./card-M37lGuYE.js";import{c as t}from"./index-jC_eNIha.js";import"./utils-jAU0Cazi.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],m=t("RotateCcw",l);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"11",x2:"11",y1:"8",y2:"14",key:"1vmskp"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]],y=t("ZoomIn",x);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]],d=t("ZoomOut",h);function C({scale:s,onZoomIn:c,onZoomOut:a,onReset:i}){const n=Math.round(s*100);return e.jsxs(r,{className:"absolute top-4 right-4 z-10 flex flex-col gap-1 p-2 shadow-lg",children:[e.jsx(o,{variant:"ghost",size:"icon",onClick:c,title:"Zoom avant (Ctrl + Molette haut)",className:"h-8 w-8",children:e.jsx(y,{className:"h-4 w-4"})}),e.jsxs("div",{className:"px-2 py-1 text-center text-xs font-medium",children:[n,"%"]}),e.jsx(o,{variant:"ghost",size:"icon",onClick:a,title:"Zoom arrière (Ctrl + Molette bas)",className:"h-8 w-8",children:e.jsx(d,{className:"h-4 w-4"})}),e.jsx("div",{className:"my-1 border-t"}),e.jsx(o,{variant:"ghost",size:"icon",onClick:i,title:"Réinitialiser le zoom",className:"h-8 w-8",children:e.jsx(m,{className:"h-4 w-4"})})]})}export{C as ZoomControls};

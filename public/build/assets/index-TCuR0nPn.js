import{r as i,j as v}from"./app-D1rK_MZr.js";import{a as x}from"./utils-jAU0Cazi.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=n=>n.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),w=(...n)=>n.filter((t,e,r)=>!!t&&t.trim()!==""&&r.indexOf(t)===e).join(" ").trim();/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var R={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=i.forwardRef(({color:n="currentColor",size:t=24,strokeWidth:e=2,absoluteStrokeWidth:r,className:o="",children:l,iconNode:a,...u},d)=>i.createElement("svg",{ref:d,...R,width:t,height:t,stroke:n,strokeWidth:r?Number(e)*24/Number(t):e,className:w("lucide",o),...u},[...a.map(([s,c])=>i.createElement(s,c)),...Array.isArray(l)?l:[l]]));/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=(n,t)=>{const e=i.forwardRef(({className:r,...o},l)=>i.createElement(k,{ref:l,iconNode:t,className:w(`lucide-${N(n)}`,r),...o}));return e.displayName=`${n}`,e};function h(n,t){if(typeof n=="function")return n(t);n!=null&&(n.current=t)}function j(...n){return t=>{let e=!1;const r=n.map(o=>{const l=h(o,t);return!e&&typeof l=="function"&&(e=!0),l});if(e)return()=>{for(let o=0;o<r.length;o++){const l=r[o];typeof l=="function"?l():h(n[o],null)}}}}function D(...n){return i.useCallback(j(...n),n)}var A=i.forwardRef((n,t)=>{const{children:e,...r}=n,o=i.Children.toArray(e),l=o.find(S);if(l){const a=l.props.children,u=o.map(d=>d===l?i.Children.count(a)>1?i.Children.only(null):i.isValidElement(a)?a.props.children:null:d);return v.jsx(y,{...r,ref:t,children:i.isValidElement(a)?i.cloneElement(a,void 0,u):null})}return v.jsx(y,{...r,ref:t,children:e})});A.displayName="Slot";var y=i.forwardRef((n,t)=>{const{children:e,...r}=n;if(i.isValidElement(e)){const o=W(e),l=P(r,e.props);return e.type!==i.Fragment&&(l.ref=t?j(t,o):o),i.cloneElement(e,l)}return i.Children.count(e)>1?i.Children.only(null):null});y.displayName="SlotClone";var O=({children:n})=>v.jsx(v.Fragment,{children:n});function S(n){return i.isValidElement(n)&&n.type===O}function P(n,t){const e={...t};for(const r in t){const o=n[r],l=t[r];/^on[A-Z]/.test(r)?o&&l?e[r]=(...u)=>{l(...u),o(...u)}:o&&(e[r]=o):r==="style"?e[r]={...o,...l}:r==="className"&&(e[r]=[o,l].filter(Boolean).join(" "))}return{...n,...e}}function W(n){var r,o;let t=(r=Object.getOwnPropertyDescriptor(n.props,"ref"))==null?void 0:r.get,e=t&&"isReactWarning"in t&&t.isReactWarning;return e?n.ref:(t=(o=Object.getOwnPropertyDescriptor(n,"ref"))==null?void 0:o.get,e=t&&"isReactWarning"in t&&t.isReactWarning,e?n.props.ref:n.props.ref||n.ref)}const g=n=>typeof n=="boolean"?`${n}`:n===0?"0":n,b=x,F=(n,t)=>e=>{var r;if((t==null?void 0:t.variants)==null)return b(n,e==null?void 0:e.class,e==null?void 0:e.className);const{variants:o,defaultVariants:l}=t,a=Object.keys(o).map(s=>{const c=e==null?void 0:e[s],m=l==null?void 0:l[s];if(c===null)return null;const f=g(c)||g(m);return o[s][f]}),u=e&&Object.entries(e).reduce((s,c)=>{let[m,f]=c;return f===void 0||(s[m]=f),s},{}),d=t==null||(r=t.compoundVariants)===null||r===void 0?void 0:r.reduce((s,c)=>{let{class:m,className:f,...E}=c;return Object.entries(E).every(V=>{let[C,p]=V;return Array.isArray(p)?p.includes({...l,...u}[C]):{...l,...u}[C]===p})?[...s,m,f]:s},[]);return b(n,a,d,e==null?void 0:e.class,e==null?void 0:e.className)};export{A as S,j as a,F as b,B as c,O as d,D as u};

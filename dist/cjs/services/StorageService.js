"use strict";var i=Object.defineProperty;var c=Object.getOwnPropertyDescriptor;var o=Object.getOwnPropertyNames;var g=Object.prototype.hasOwnProperty;var b=(r,e)=>{for(var t in e)i(r,t,{get:e[t],enumerable:!0})},f=(r,e,t,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of o(e))!g.call(r,s)&&s!==t&&i(r,s,{get:()=>e[s],enumerable:!(a=c(e,s))||a.enumerable});return r};var m=r=>f(i({},"__esModule",{value:!0}),r);var u={};b(u,{StorageService:()=>n});module.exports=m(u);var n=class{static getLatencies(e){return e==="browser"?JSON.parse(localStorage.getItem("rpcLatencies")||"{}"):{}}static getRefreshLatencies(e){return e==="browser"?JSON.parse(localStorage.getItem("refreshLatencies")||"0"):0}static setLatencies(e,t){e==="browser"&&localStorage.setItem("rpcLatencies",JSON.stringify(t))}static setRefreshLatencies(e,t){e==="browser"&&localStorage.setItem("refreshLatencies",JSON.stringify(t))}};0&&(module.exports={StorageService});

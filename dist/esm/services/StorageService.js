var t=class{static getLatencies(e){return e==="browser"?JSON.parse(localStorage.getItem("rpcLatencies")||"{}"):{}}static getRefreshLatencies(e){return e==="browser"?JSON.parse(localStorage.getItem("refreshLatencies")||"0"):0}static setLatencies(e,r){e==="browser"&&localStorage.setItem("rpcLatencies",JSON.stringify(r))}static setRefreshLatencies(e,r){e==="browser"&&localStorage.setItem("refreshLatencies",JSON.stringify(r))}};export{t as StorageService};

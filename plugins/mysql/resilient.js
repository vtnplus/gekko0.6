/***
Function which calls the promise and if the result of the promise is empty (e.g nor results are now available)
so we try after intervall (defatul 1sec) again. Limit is the max retries.

return is a promise with result.
*/
function callFunctionWithIntervall(limit, func, intervall = 1000) {
   limit--; // we call already here first time the function
   const promiseToCall = func();

   const promiseResult = promiseToCall.then((data) => {
     if (data && data.length>=0) {
       return  new Promise((resolve, reject)=> {
         resolve(data);
       });
     } else {
       if (limit>0) {
         return funcWithTimeout(limit, limit, func, intervall);
       } else {
         return new Promise.reject("empty object");
       }
     }
   }).catch((error)=> {
     if (limit>0) {
       return funcWithTimeout(limit, limit, func, intervall);
     } else {
       return new Promise.reject(error);
     }
   });

   return promiseResult;
 }

function funcWithTimeout(limit, maxlimit, func, intervall){
  const promiseToCall = func();

  const promise = new Promise((resolve, reject)=>{

  setTimeout(function() {
    promiseToCall.then((data)=>{
      console.log("try again : "+limit + " interval: "+intervall);
      if (limit <= 1 || (data && data.length>=0)) {
        resolve(data);
      } else {
        funcWithTimeout (--limit, maxlimit, func, (maxlimit-limit)*(maxlimit-limit)*1000).then((res)=> resolve(res)).catch((error)=>reject(error));
      }
    }).catch((error)=> {
      console.log("error: "+ error+ " try again : "+limit);
      if (limit <=1 ) {
        console.log("funcWithTimeout:"+JSON.stringify(error));
        reject(error);
      } else {
        funcWithTimeout (--limit, maxlimit, func, (maxlimit-limit)*(maxlimit-limit)*1000).then((res)=> resolve(res)).catch((error)=>reject(error));
      }
    });
  }, intervall);
  });

  return promise;
}

module.exports = {callFunctionWithIntervall};

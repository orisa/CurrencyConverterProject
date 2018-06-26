 /**
  *  stores results containing currency names from the currencies api endpoint 
  * @type {object}
  */
 let results = null;

 const fromElemId = "fromCurrencyNameBtn";
 const defaultFromElemId = "defaultFromCurrencyName"
 const toElemId = "toCurrencyNameBtn";
 const defaultToElemId = "defaultToCurrencyName";

 let fromCurrencyId = null; // currency id of currency to converted from
 let toCurrencyId = null; // currency id  of currency to converted to

 /**
  * Returns a sorted list of currency names given url of api endpoint
  *
  * @return {Array}
  */
 let getCurrencyNames = async (requestUrl) => {

     let list = [];

     let namesResponse = await fetch(requestUrl);
     let names = await namesResponse.json();

     results = names.results;
     for (let currencyId in results) {
         const currencyObj = names.results[currencyId];
         list.push(currencyObj.currencyName);
     }
     list.sort();
     return list;
 }

 /**
  * Populates the dropdown list of select button with currencynames
  * given currencynames, selectelementid and optionelementid
  *
  * @param {array} currencyNames
  * @param {string} selectElemId
  * @param {string} optionElemId
  */
 let populateSelectBtn = (currencyNames, selectElemId, optionElemId) => {
     if (!currencyNames || currencyNames.length == 0) {
         showErrMsg('currency names not available. Reload')
         return;
     }

     if (!selectElemId || !optionElemId) return;

     let btnElem = document.getElementById(selectElemId);
     btnElem.disabled = false;
     removeDefaultCurrencyName(optionElemId);
     currencyNames.forEach((currencyName) => {
         let optionElem = document.createElement('option');
         optionElem.value = currencyName;
         optionElem.innerHTML = currencyName;
         btnElem.appendChild(optionElem);
     });
 }

 /**
  * Removes default option element from the select element
  * given the optionelementid
  *
  * @param {string} optionElemId
  */
 let removeDefaultCurrencyName = (optionElemId) => {
     let defaultOptionElem = document.getElementById(optionElemId);
     defaultOptionElem.parentNode.removeChild(defaultOptionElem);
 }

 /**
  * Returns currency id given the currency name selected by user
  *
  * @param {string} userCurrencyName
  */
 let getCurrencyId = (userCurrencyName) => {
     if (!results || !userCurrencyName) {
         showErrMsg('currency Id cannot be found. Reload')
     }

     for (let currencyId in results) {
         const currencyObj = results[currencyId];
         if (currencyObj.currencyName == userCurrencyName) {
             return currencyObj.id;
         }
     }

     showErrMsg('currency Id cannot be found. Reload');
 }

 let disableBtn = (selectElemId) => {
     let selectElem = document.getElementById(selectElemId);
     selectElem.disabled = true;
 }


 let getExchangeRate = (fromCurrencyCode = 'USD', toCurrencyCode = 'NGN') => {
     if (!fromCurrencyCode || !toCurrencyCode) return;

     let query = `${fromCurrencyCode}_${toCurrencyCode}`;

     const requestUrl = `https://free.currencyconverterapi.com/api/v5/convert?q=${query}&compact=y`;

     fetch(requestUrl)
         .then(function (response) {
             return response.json();
         })
         .then(function (xchangeJson) {
             console.log(xchangeJson);
             document.getElementById('rateField').value = xchangeJson['NGN_USD'].val;

         });

 }



 let showErrMsg = (msg) => {
     console.log(msg);
 }

 document.addEventListener('DOMContentLoaded', () => {

     let selectElem = null;
     selectElem = document.getElementById(fromElemId);
     selectElem.addEventListener('change', (event) => {
         if (event.target.value) {
             // get currency id of currency to convert from            
             fromCurrencyId = getCurrencyId(event.target.value);
         }
     });

     selectElem = document.getElementById(toElemId);
     selectElem.addEventListener('change', (event) => {
         if (event.target.value) {
             // get currency id of currency to convert to
             toCurrencyId = getCurrencyId(event.target.value);
         }
     });
 })

 window.onload = () => {

     const requestUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';

     disableBtn(fromElemId);
     disableBtn(toElemId);

     getCurrencyNames(requestUrl).then(currencyNames => {
         populateSelectBtn(currencyNames, fromElemId, defaultFromElemId);
         populateSelectBtn(currencyNames, toElemId, defaultToElemId);
     });
 }

 //  export {
 //      getCurrencyNames
 //  };
  /**
   *  stores results containing currency names from the currencies api endpoint 
   * @type {object}
   */
  let results = null;

  /******************** ids of html elements *****************/

  const fromElemId = "fromCurrencyNameBtn";
  const defaultFromElemId = "defaultFromCurrencyName"
  const toElemId = "toCurrencyNameBtn";
  const defaultToElemId = "defaultToCurrencyName";
  const amountElemId = 'amount';

  let fromCurrencyName = "British Pound";
  let toCurrencyName = "Nigerian Naira";

  let fromCurrencyId = null; // currency id of currency to converted from
  let toCurrencyId = null; // currency id  of currency to converted to
  let amount = 1.0;

  const requestUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';
  const convertUrl = "https://free.currencyconverterapi.com/api/v5/convert";

  const cacheType = '.cacheType';
  const networkType = '.networkType'
  let isNetworkNamesHidden = false;

  /********** indexeddb  ******************/
  const rateStoreName = 'rates';
  const currenciesStoreName = 'currenciesNames';

  let dbPromise = idb.open('cc-db', 2, function (upgradeDb) {
      switch (upgradeDb.oldVersion) {
          case 0:
              let rateStore = upgradeDb.createObjectStore(rateStoreName, {
                  keyPath: 'currencyIdPair'
              });
          case 1:
              let namesStore = upgradeDb.createObjectStore(currenciesStoreName, {
                  keyPath: 'name'
              });
      }
  });

  let getCachedCurrencyNames = () => {

      let list = [];
      return dbPromise.then(db => {

          let tx = db.transaction(currenciesStoreName);
          let currenciesNamesStore = tx.objectStore(currenciesStoreName);

          return currenciesNamesStore.getAll().then(currencies => {
              if (currencies) {
                  for (let currencyObj of currencies) {
                      list.push(currencyObj.name)
                  }
              }
              return list;
          });
      });
  };
  /**
   * Returns a sorted list of currency names given url of api endpoint
   *
   * @return {array}
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
      removeDefaultCurrencyName(selectElemId, optionElemId);
      currencyNames.forEach((currencyName) => {
          let optionElem = document.createElement('option');
          if (navigator.onLine) {
              //   optionElem.setAttribute('data-type', networkType)
              optionElem.classList.add("networkType")
          } else {
              //optionElem.setAttribute('data-type', cacheType)
              optionElem.classList.add("cacheType")

          }
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
  let removeDefaultCurrencyName = (selectElemId, optionElemId) => {
      //   let defaultOptionElem = document.getElementById(optionElemId);
      //   defaultOptionElem.parentNode.removeChild(defaultOptionElem);
      var parent = document.getElementById(selectElemId);
      var child = document.getElementById(optionElemId);
      //parent.removeChild(child)
      child.setAttribute('hidden', 'true');
  }

  /**
   * Returns currency id given the currency name selected by user
   *
   * @param {string} userCurrencyName
   */
  let getCurrencyId = (userCurrencyName) => {
      if (!results || !userCurrencyName) {
          showErrMsg('an invalid currency name specified. Reload')
      }

      for (let currencyId in results) {
          const currencyObj = results[currencyId];
          if (currencyObj.currencyName == userCurrencyName) {
              return currencyObj.id;
          }
      }

      showErrMsg('currency Id cannot be found. Reload');
  }

  let disableSelectBtns = (newState) => {
      document.getElementById(fromElemId).disabled = newState;
      document.getElementById(toElemId).disabled = newState;
  }

  /**
   * Gets exchange rate to convert fromCurrency to toCurrency given
   * given  url of the convert endpoint, fromCurrencyId and toCurrencyId
   *
   * @param {string} convertRequestUrl
   * @param {string} fromCurrencyId
   * @param {string} toCurrencyId
   * @return {number} 
   */
  let getExchangeRate = async (requestUrl, fromCurrencyId = 'USD', toCurrencyId = 'NGN') => {
      if (!requestUrl || !fromCurrencyId || !toCurrencyId) return;

      const query = `${fromCurrencyId}_${toCurrencyId}`;

      requestUrl = `${requestUrl}?q=${query}&compact=y`;

      const xchangeRateResponse = await fetch(requestUrl);
      const xchangeRateObj = await xchangeRateResponse.json();
      const rate = xchangeRateObj[query].val;
      return Math.round(rate * 10000) / 10000;
  }

  /**
   * Updates the exchange rate input box with new exchange rate
   * given  the new exchange rate
   *
   * @param {number} newXchangeRate
   * 
   */
  let updateXchangeRate = (newXchangeRate) => {
      if (!newXchangeRate) return;
      document.getElementById('rateField').value = newXchangeRate.toString();
  }

  /**
   * converts an amount from once currency to another
   * given  the amount, fromCurrencyId and toCurrencyId
   *
   * @param {number} xchangeRate
   * @return {number} 
   */
  let convertAmt = (xchangeRate) => {
      // get user amount
      let amountElem = document.getElementById('amount');
      if (!amountElem.value) return;
      return roundToTwoDecimalPlaces(parseFloat(amountElem.value) * xchangeRate);
  }

  let showErrMsg = (msg) => {
      //   console.log(msg);
      alert(msg);
  }

  let roundToTwoDecimalPlaces = (value) => {
      return Math.round(value * 10000) / 10000;
  }

  /**
   * Updates the result input box with converted amount
   * given  the new result
   *
   * @param {number} newResult
   * 
   */
  let updateResult = (newResult) => {
      if (!newResult) return;
      document.getElementById('result').value = newResult.toString();
  }



  let convertCurrencies = async () => {
      const rate = await getExchangeRate(convertUrl, fromCurrencyId, toCurrencyId);
      if (rate) {
          const convertedAmt = convertAmt(rate);
          updateResult(convertedAmt);
          //console.log(convertedAmt); 
          return rate;
      }
  }

  //   let convertCurrencies = () => {
  //       getExchangeRate(convertUrl, fromCurrencyId, toCurrencyId).then(rate => {
  //           const convertedAmt = convertAmt(rate);
  //           updateResult(convertedAmt);
  //           //console.log(convertedAmt); 
  //           return rate;
  //       });
  //   }

  let setDefaultCurrencyNames = (fromCurrencyName, toCurrencyName) => {
      //set currency ids
      fromCurrencyId = getCurrencyId(fromCurrencyName);
      toCurrencyId = getCurrencyId(toCurrencyName);
      // update select buttons
      document.getElementById(fromElemId).value = fromCurrencyName;
      document.getElementById(toElemId).value = toCurrencyName;

  }

  let setCachedDefaultCurrencyNames = (fromCurrencyName, toCurrencyName) => {
      //set currency ids

      dbPromise.then(function (db) {
          let tx = db.transaction(currenciesStoreName, 'readwrite');
          let currenciesNameStore = tx.objectStore(currenciesStoreName);

          currenciesNameStore.get(fromCurrencyName).then(fromCurrencyObj => {
              if (fromCurrencyObj) {
                  fromCurrencyId = fromCurrencyObj.id;
              }
          })
          currenciesNameStore.get(toCurrencyName).then(toCurrencyObj => {
              if (toCurrencyObj) {
                  toCurrencyId = toCurrencyObj.id;

              }
          });

          // update select buttons
          document.getElementById(fromElemId).value = fromCurrencyName;
          document.getElementById(toElemId).value = toCurrencyName;
      });

  }

  let setDefaultAmount = (amount) => {

      if (!amount || amount > 1.0) return;

      let amountElem = document.getElementById('amount');
      amountElem.value = amount.toString();

  }

  let updateXchangeRateStore = (rate, fromCurrencyId, toCurrencyId) => {
      const currencyIdPair = `${fromCurrencyId}_${toCurrencyId}`;


      // add people to "people"
      dbPromise.then(function (db) {
          let tx = db.transaction(rateStoreName, 'readwrite');
          let rateStore = tx.objectStore(rateStoreName);

          rateStore.put({
              currencyIdPair: currencyIdPair,
              xChangeRate: rate,
              fromCurrencyId: fromCurrencyId,
              toCurrencyId: toCurrencyId
          });
      });
  }

  let updateCurrencyNamesStore = (fromCurrencyObj, toCurrencyObj) => {


      dbPromise.then(function (db) {
          let tx = db.transaction(currenciesStoreName, 'readwrite');
          let currenciesNamesStore = tx.objectStore(currenciesStoreName);

          currenciesNamesStore.put(fromCurrencyObj);
          currenciesNamesStore.put(toCurrencyObj);


      });
  }

  let convertAmount = () => {
      convertCurrencies().then(rate => {
          console.log(rate);
          updateXchangeRateStore(rate, fromCurrencyId, toCurrencyId);
          updateCurrencyNamesStore({
              name: fromCurrencyName,
              id: fromCurrencyId
          }, {
              name: toCurrencyName,
              id: toCurrencyId
          });
      });
  }


  /**
   * Removes currency names from dom
   * given  the select element id and the type of currency name to remove 
   *
   * @param {string} elemId
   * @param {string} type
   */
  let removeCurrencyNames = (elemId, type) => {
      let selectElem = document.getElementById(elemId);
      let optionElems = selectElem.querySelectorAll(type);
      for (let elem of optionElems) {
          elem.remove();
      }
  }

  /**
   * Disables select elements for 1 sec so that its is compleltely populated with currency names 
   * in order to allow user see all currency names. 
   * given  the select element id and the type of currency name to remove 
   *
   */

  toggleBtnState = () => {
      document.getElementById(fromElemId).disabled = true;
      document.getElementById(toElemId).disabled = true;

      setTimeout(() => {
          document.getElementById(fromElemId).disabled = false;
          document.getElementById(toElemId).disabled = false;
      }, 1000);

  }


  let showCachedCurrenciesNames = () => {

      toggleBtnState();

      getCachedCurrencyNames().then((currencyNames) => {
          for (let elemId of [fromElemId, toElemId]) {
              if (!isNetworkNamesHidden) {
                  // hideNetworkCurrencyNames(fromElemId);
                  hideNetworkCurrencyNames(elemId);
              }

              removeCurrencyNames(elemId, cacheType);

          }
          isNetworkNamesHidden = true;

          populateSelectBtn(currencyNames, fromElemId, defaultFromElemId);
          populateSelectBtn(currencyNames, toElemId, defaultToElemId);

      })

  }

  let showNetworkCurrenciesNames = (elemId) => {
      toggleBtnState()
      getCurrencyNames(requestUrl).then((currencyNames) => {
          for (let elemId of [fromElemId, toElemId]) {
              if (isNetworkNamesHidden) {
                  // hideNetworkCurrencyNames(fromElemId);
                  showNetworkCurrencyNames(elemId);
              }
              removeCurrencyNames(elemId, cacheType);

          }
          isNetworkNamesHidden = false;
          populateSelectBtn(currencyNames, fromElemId, defaultFromElemId);
          populateSelectBtn(currencyNames, toElemId, defaultToElemId);

      })
  }


  let hideNetworkCurrencyNames = (id) => {
      let selectElem = document.getElementById(id);
      let optionElems = selectElem.querySelectorAll(networkType);
      for (let elem of optionElems) {
          elem.setAttribute('hidden', 'true');
      }

  }

  let showNetworkCurrencyNames = (id) => {
      let selectElem = document.getElementById(id);
      let optionElems = selectElem.querySelectorAll(networkType);
      for (let elem of optionElems) {
          elem.setAttribute('hidden', 'false');
      }

  }




  document.addEventListener('DOMContentLoaded', () => {

      let selectElem = null;
      let amountElem = null;

      selectElem = document.getElementById(fromElemId);
      window.addEventListener('offline', showCachedCurrenciesNames);
      window.addEventListener('online', showNetworkCurrenciesNames);

      selectElem.addEventListener('change', (event) => {
          if (event.target.value) {
              fromCurrencyName = event.target.value;
              // get currency id of currency to convert from            
              fromCurrencyId = getCurrencyId(event.target.value);
              //convertCurrencies();
              convertAmount();
          }
      });

      selectElem = document.getElementById(toElemId);
      selectElem.addEventListener('change', (event) => {
          if (event.target.value) {
              toCurrencyName = event.target.value;
              // get currency id of currency to convert to
              toCurrencyId = getCurrencyId(event.target.value);
              convertAmount();
              //   convertCurrencies();
          }
      });

      amountElem = document.getElementById(amountElemId);
      amountElem.addEventListener('input', convertAmount)
  })

  window.onload = () => {

      if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/serviceworker.js')
              .then(registrationObj => {
                  console.log('Service worker is registered with scope', registrationObj.scope);
              }).catch(err => {
                  console.log('Service worker is not registered', err);
              });
      }

      disableSelectBtns(true);

      getCachedCurrencyNames().then((currencyNames) => {
          populateSelectBtn(currencyNames, fromElemId, defaultFromElemId);
          populateSelectBtn(currencyNames, toElemId, defaultToElemId);
          setCachedDefaultCurrencyNames(fromCurrencyName, toCurrencyName);
          setDefaultAmount(amount);
          //convertAmount();

      })

      getCurrencyNames(requestUrl).then(currencyNames => {
          populateSelectBtn(currencyNames, fromElemId, defaultFromElemId);
          populateSelectBtn(currencyNames, toElemId, defaultToElemId);
          setDefaultCurrencyNames(fromCurrencyName, toCurrencyName);
          setDefaultAmount(amount)
          convertAmount();
      }).catch(err => {
          console.log('currency names not found')
      });
  }
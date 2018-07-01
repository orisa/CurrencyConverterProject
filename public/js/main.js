  /**
   *  stores results containing currency names from the currencies api endpoint 
   * @type {object}
   */
  let results = null;
  let cachedResults = null;
  let conversionResult = 1;

  /******************** ids of html elements *****************/

  const fromElemId = "fromCurrencyNameBtn";
  const defaultFromElemId = "defaultFromCurrencyName"
  const toElemId = "toCurrencyNameBtn";
  const defaultToElemId = "defaultToCurrencyName";
  const amountElemId = 'amount';
  const descId = 'desc';

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

  let updateResultEvent = new CustomEvent('update_result', {
      detail: conversionResult
  });

  self.addEventListener('update_result', (e) => {
      console.log('dispatched');
      console.dir(e.detail);
  })

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
              cachedResults = currencies;
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
  let getCurrencyNames = (requestUrl) => {

      let list = [];
      let cachedData = false;



      return getCachedCurrencyNames().then(cachedNames => {
          if (cachedNames.length > 0) {
              cachedNames.sort();
              list = cachedNames;
          }

          return fetch(requestUrl).then(namesResponse => {
              return namesResponse.json().then(names => {
                  results = names.results;
                  list = [];
                  for (let currencyId in results) {
                      const currencyObj = names.results[currencyId];
                      list.push(currencyObj.currencyName);
                  }
                  list.sort();
                  return list;
              });

          }).catch(() => {
              return list;
          })
      })

  }

  let includesRateObj = (rateList, newRateObj) => {
      let found = false;
      for (let rateObj of rateList) {
          if ((rateObj.fromCurrencyName == newRateObj.fromCurrencyName) &&
              (rateObj.toCurrencyName == newRateObj.toCurrencyName)) {
              found = true;
              return found;
          }
      }
      return found;
  }

  let getSelectElemCurrencyNames = (elemId) => {

      return dbPromise.then(function (db) {
          let list = [];
          let tx = db.transaction(rateStoreName, 'readwrite');
          let ratesStore = tx.objectStore(rateStoreName);
          return ratesStore.getAll().then(rateList => {
              for (let rateObj of rateList) {
                  if (elemId == fromElemId && !list.includes(rateObj.fromCurrencyName)) {
                      list.push(rateObj.fromCurrencyName)
                  } else if (elemId == toElemId && !list.includes(rateObj.toCurrencyName)) {
                      list.push(rateObj.toCurrencyName)
                  } else {}
              }
              return list;
          })

      })


  }

  /**
   * Populates the dropdown list of select button with currencynames
   * given currencynames, selectelementid and optionelementid
   *
   * @param {array} currencyNames
   * @param {string} selectElemId
   * @param {string} optionElemId
   */
  let populateSelectBtn = async (currencyNames, selectElemId, optionElemId) => {
      if (!currencyNames || currencyNames.length == 0) {
          showErrMsg('currency names not available. Reload')
          return;
      }

      if (!selectElemId || !optionElemId) return;

      let btnElem = document.getElementById(selectElemId);
      btnElem.disabled = false;
      removeDefaultCurrencyName(selectElemId, optionElemId);
      // if offline get currency names based on select button 
      if (!navigator.onLine) {
          currencyNames = await getSelectElemCurrencyNames(selectElemId);
          currencyNames
      }

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

      let id = getCachedCurrencyId(userCurrencyName);
      if (id) return id;

      if (!results) {
          showErrMsg('Currencies are not available are the moment. Reload')
      }
      if (!userCurrencyName) {
          showErrMsg('An invalid currency name specified. Reload')
      }

      for (let currencyId in results) {
          const currencyObj = results[currencyId];
          if (currencyObj.currencyName == userCurrencyName) {
              return currencyObj.id;
          }
      }

      showErrMsg('currency Id cannot be found. Reload');
  }

  /**
   * Returns currency id given the currency name selected by user
   *
   * @param {string} userCurrencyName
   */
  let getCachedCurrencyId = (userCurrencyName) => {

      for (let cachedResult of cachedResults) {
          if (cachedResult.name == userCurrencyName) {
              return cachedResult.id;
          }
      }

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
  let getExchangeRate = (requestUrl, fromCurrencyId = 'USD', toCurrencyId = 'NGN') => {
      if (!requestUrl || !fromCurrencyId || !toCurrencyId) return;

      const query = `${fromCurrencyId}_${toCurrencyId}`;

      requestUrl = `${requestUrl}?q=${query}&compact=y`;

      let cachedRatePromise = dbPromise.then(function (db) {
          let tx = db.transaction(rateStoreName, 'readwrite');
          let ratesStore = tx.objectStore(rateStoreName);

          return ratesStore.get(query).then(rateObj => {
              return roundToTwoDecimalPlaces(rateObj.xChangeRate);
          })

      });

      let networkDataReceived = false;

      let networkRate = fetch(requestUrl).then(xChangeRateResponse => {
          return xChangeRateResponse.json().then(xChangeRate => {
              const rate = roundToTwoDecimalPlaces(xChangeRate[query].val)
              updateXchangeRateStore(rate, fromCurrencyId, toCurrencyId);
              console.log('added fresh data');
              networkDataReceived = true;
              return rate;
              //return cachedRate;
          })
      })

      return rate = cachedRatePromise.then(cachedRate => {
          console.log('returned cached data')
          if (!networkDataReceived) {
              return cachedRate;
          }
          return networkRate;
      }).catch(() => {
          if (networkDataReceived) {
              return networkRate;
          }
          return -1; // rate note available offline
      })

  }

  let getCachedExchangeRate = async (fromCurrencyId, toCurrencyId) => {
      if (!fromCurrencyId || !toCurrencyId) return;

      const query = `${fromCurrencyId}_${toCurrencyId}`;

      return dbPromise.then(function (db) {
          let tx = db.transaction(rateStoreName, 'readwrite');
          let ratesStore = tx.objectStore(rateStoreName);

          return ratesStore.get(query).then(rateObj => {
              return roundToTwoDecimalPlaces(rateObj.xChangeRate);
          })

      });
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
      let resultElem = document.getElementById('result')
      if (newResult < 0) {
          resultElem.classList.add('notAvailable');
          resultElem.value = "Not Available Offline";
      } else {
          resultElem.value = newResult.toString();
      }

  }

  let updateDescription = (result) => {
      let userAmount = document.getElementById(amountElemId).value;
      let descElem = document.getElementById(descId);
      if (result >= 0) {
          descElem.innerHTML =
              `${userAmount} from ${fromCurrencyName} to ${toCurrencyName} is ${result}`;
      } else {
          descElem.innerHTML = "";
      }
  }



  let convertCurrencies = () => {
      getExchangeRate(convertUrl, fromCurrencyId, toCurrencyId).then(rate => {

          if (rate < 0) {
              updateResult(rate);
              updateDescription(rate);
              return;
          }

          const convertedAmt = convertAmt(rate);
          updateResult(convertedAmt);
          updateDescription(convertAmt)
          updateCurrencyNamesStore({
              name: fromCurrencyName,
              id: fromCurrencyId
          }, {
              name: toCurrencyName,
              id: toCurrencyId
          });

      })
  }



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
              toCurrencyId: toCurrencyId,
              fromCurrencyName: fromCurrencyName,
              toCurrencyName: toCurrencyName
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

  let convertWithCachedRate = () => {
      // get cached xchange rate
      return getCachedExchangeRate(fromCurrencyId, toCurrencyId).then(rate => {
          return convertAmt(rate);
      })
      //const xchangeRage = getCachedXchangeRate(frm)
      // convert amount return result
  }

  let convertAmount = () => {
      convertCurrencies();
  }


  /**
   * Removes currency names from dom
   * given  the select element id and the css selector of currency name to remove 
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

  //   let setupCurrencyPairDialog = () => {
  //       // get rate pairs containing fromCurrency name

  //       let dialog = document.getElementById('dialog');
  //       removeCurrencyNames('dialog', 'div');
  //       // dialog.innerHTML = "";
  //       let heading = document.getElementById('heading');
  //       heading.innerHTML = `Rates Available For ${fromCurrencyName}`;

  //       dbPromise.then((db) => {
  //           let list = [];
  //           let tx = db.transaction(rateStoreName, 'readwrite');
  //           let ratesStore = tx.objectStore(rateStoreName);
  //           ratesStore.getAll().then(rateList => {
  //               for (let rateObj of rateList) {
  //                   if (rateObj.fromCurrencyName == fromCurrencyName) {
  //                       let divElem = document.createElement('div');
  //                       divElem.innerHTML = `${rateObj.fromCurrencyName} to ${rateObj.toCurrencyName}`;
  //                       divElem.addEventListener('click', processCurrencyPair)
  //                       dialog.appendChild(divElem);
  //                   }
  //               }
  //           })
  //       })

  //   }

  //   let processCurrencyPair = (event) => {
  //       if (event) {
  //           let pairText = event.target.innerHTML;
  //           let pair = pairText.split('to');
  //           fromCurrencyName = pair[0].trim();
  //           toCurrencyName = pair[1].trim();
  //           fromCurrencyId = getCurrencyId(fromCurrencyName);
  //           toCurrencyId = getCurrencyId(toCurrencyName);
  //           document.getElementById(fromElemId).value = fromCurrencyName;
  //           document.getElementById(toElemId).value = toCurrencyName;
  //           convertAmount();
  //           let modal = document.getElementById('myModal');
  //           modal.style.display = 'none';
  //       }
  //   }

  //   let showCurrencyPairDialog = () => {
  //       // Get the modal
  //       let modal = document.getElementById('myModal');

  //       // Get the <span> element that closes the modal
  //       let span = document.getElementsByClassName("close")[0];

  //       modal.style.display = "block";

  //       // When the user clicks on <span> (x), close the modal
  //       span.onclick = function () {
  //           modal.style.display = "none";
  //       }

  //       // When the user clicks anywhere outside of the modal, close it
  //       window.onclick = function (event) {
  //           if (event.target == modal) {
  //               modal.style.display = "none";
  //           }
  //       }
  //   }

  let showCachedCurrenciesNames = () => {

      toggleBtnState();

      getCurrencyNames().then((currencyNames) => {
          for (let elemId of [fromElemId, toElemId]) {
              if (!isNetworkNamesHidden) {
                  // hideNetworkCurrencyNames(fromElemId);
                  hideNetworkCurrencyNames(elemId);
              }

              removeCurrencyNames(elemId, cacheType);

          }
          isNetworkNamesHidden = true;

          //setupCurrencyPairDialog();
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

  let setupMatchingToCurrencyNames = (fromCurrencyName) => {

      let matchedCurrencyNames = [];

      return dbPromise.then((db) => {
          let tx = db.transaction(rateStoreName, 'readwrite');
          let ratesStore = tx.objectStore(rateStoreName);
          return ratesStore.getAll().then(rateList => {
              for (let rateObj of rateList) {
                  if (rateObj.fromCurrencyName == fromCurrencyName) {
                      matchedCurrencyNames.push(rateObj.toCurrencyName);
                  }
              }

              //populateSelectBtn(list, toElemId, defaultToElemId);
              removeCurrencyNames(toElemId, 'option');
              let btnElem = document.getElementById(toElemId);
              matchedCurrencyNames.forEach((currencyName) => {
                  let optionElem = document.createElement('option');
                  optionElem.value = currencyName;
                  optionElem.innerHTML = currencyName;
                  btnElem.appendChild(optionElem);
              });

              toCurrencyName = document.getElementById(toElemId).value;
              toCurrencyId = getCurrencyId(toCurrencyName);
              return tx.complete;
              //convertAmount();


          })
      })
  }



  document.addEventListener('DOMContentLoaded', () => {

      let selectElem = null;
      let amountElem = null;
      let cachedCurrencyId = null;

      selectElem = document.getElementById(fromElemId);
      window.addEventListener('offline', showCachedCurrenciesNames);
      window.addEventListener('online', showNetworkCurrenciesNames);

      selectElem.addEventListener('change', (event) => {
          if (event.target.value) {

              fromCurrencyName = document.getElementById(fromElemId).value;
              fromCurrencyId = getCurrencyId(fromCurrencyName);
              toCurrencyName = document.getElementById(toElemId).value;
              toCurrencyId = getCurrencyId(toCurrencyName);

              if (!navigator.onLine) {
                  setupMatchingToCurrencyNames(fromCurrencyName).then(success => {
                      console.log(success);
                      convertCurrencies();
                  })
                  //setupCurrencyPairDialog();
                  //showCurrencyPairDialog();
              } else {
                  convertCurrencies();
              }
              //fromCurrencyId = getCurrencyId(fromCurrencyName);
              //setTimeout(convertAmount, 1000)
              //convertAmount();

          }
      });

      selectElem.addEventListener('select', () => {
          console.log('just selected');
      })

      selectElem = document.getElementById(toElemId);
      selectElem.addEventListener('change', (event) => {

          if (event.target.value) {

              toCurrencyName = document.getElementById(toElemId).value;
              toCurrencyId = getCurrencyId(toCurrencyName);
              fromCurrencyName = document.getElementById(fromElemId).value;
              fromCurrencyId = getCurrencyId(fromCurrencyName);
              convertCurrencies();
          }
      });

      amountElem = document.getElementById(amountElemId);
      amountElem.addEventListener('input', convertAmount)
  })

  window.onload = () => {
      //self.dispatchEvent(updateResultEvent);

      if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/serviceworker.js')
              .then(registrationObj => {
                  console.log('Service worker is registered with scope', registrationObj.scope);
              }).catch(err => {
                  console.log('Service worker is not registered', err);
              });
      }

      disableSelectBtns(true);

      getCurrencyNames(requestUrl).then(currencyNames => {
          populateSelectBtn(currencyNames, fromElemId, defaultFromElemId);
          populateSelectBtn(currencyNames, toElemId, defaultToElemId);
          setDefaultCurrencyNames(fromCurrencyName, toCurrencyName);
          setDefaultAmount(amount)
          fromCurrencyName = document.getElementById(fromElemId).value;
          fromCurrencyId = getCurrencyId(fromCurrencyName);

          toCurrencyName = document.getElementById(toElemId).value;
          toCurrencyId = getCurrencyId(toCurrencyName);
          convertAmount();
      }).catch(err => {
          console.log('currency names not found')
      });
  }
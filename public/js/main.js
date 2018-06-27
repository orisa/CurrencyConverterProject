  /**
   *  stores results containing currency names from the currencies api endpoint 
   * @type {object}
   */
  let results = null;

  const fromElemId = "fromCurrencyNameBtn";
  const defaultFromElemId = "defaultFromCurrencyName"
  const toElemId = "toCurrencyNameBtn";
  const defaultToElemId = "defaultToCurrencyName";
  const convertBtnId = "convertBtn";

  let fromCurrencyId = null; // currency id of currency to converted from
  let toCurrencyId = null; // currency id  of currency to converted to

  const requestUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';
  const convertUrl = "https://free.currencyconverterapi.com/api/v5/convert";

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
      return Math.round(rate * 100) / 100;
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
   * @param {string} amount
   * @param {string} fromCurrencyId
   * @param {string} toCurrencyId
   * @return {number} 
   */
  let convertAmt = (amount, fromCurrencyId, toCurrencyId) => {


  }

  let showErrMsg = (msg) => {
      console.log(msg);
  }

  let convertCurrencies = () => {
      getExchangeRate(convertUrl, fromCurrencyId, toCurrencyId).then((rate) => {
          updateXchangeRate(rate);
          console.log(rate);
      })
  }

  document.addEventListener('DOMContentLoaded', () => {

      let selectElem = null;
      let btnElem = null;

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

      btnElem = document.getElementById(convertBtnId);
      btnElem.addEventListener('click', convertCurrencies)
  })

  window.onload = () => {

      disableBtn(fromElemId);
      disableBtn(toElemId);

      getCurrencyNames(requestUrl).then(currencyNames => {
          populateSelectBtn(currencyNames, fromElemId, defaultFromElemId);
          populateSelectBtn(currencyNames, toElemId, defaultToElemId);
      });
  }
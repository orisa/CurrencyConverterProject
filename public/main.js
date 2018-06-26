let amount = 100;
let results = null;

const fromElemId = "fromCurrencyNameBtn";
const defaultElemId = "defaultFromCurrencyName"
const toElemId = "toCurrencyNameBtn";
const defaultToElemId = "defaultToCurrencyName"
let fromCurrencyId = null; // currency id of currency to be converted from
let toCurrencyId = null; // currency id  of currency to be converted to

// let defaultToCurrencyElem = document.getElementById("defaultToCurrencyName");

let getCurrencyNamesTester = async () => {

    const names = await getCurrencyNames();
    if (names.length > 0) {
        console.dir(names);
    } else {
        console.dir(names);
    }

}

// fetch currency names 
// @params
// @ return countries. type Array
// it should return a list of country names 
// ui should be updated with error msg if promise is rejected
let getCurrencyNames = async () => {

    const requestUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';
    let list = [];

    let namesResponse = await fetch(requestUrl);
    let names = await namesResponse.json();

    results = names.results;
    for (currencyId in results) {
        const currencyObj = names.results[currencyId];
        list.push(currencyObj.currencyName);
    }
    list.sort();
    return list;
}


let updateSeletBtnTester1 = () => {
    const currencyNames = ['Naira', 'Dollar', 'Pounds'];
    updateSelectBtn(currencyNames, fromElemId, defaultElemId);
    const btnElem = document.getElementById(fromElemId);
    if (btnElem.children.length == currencyNames.length) {
        console.log('currency names appended');
    }
}

let updateSeletBtnTester2 = () => {
    const currencyNames = [];
    updateSelectBtn(currencyNames, fromElemId, defaultElemId);
    const btnElem = document.getElementById(fromElemId);
    if (btnElem.children.length == currencyNames.length) {
        console.log('currency names appended');
    }
}

// it should set select button to currencyNames given currencyNames, select elem id and default option elem id
// it should enable the button if currency names is defined and not empty
// it should remove default values in the ui
let updateSelectBtn = (currencyNames, selectElemId, OptionElemId) => {
    if (!currencyNames || currencyNames.length == 0) {
        return;
    }
    let btnElem = document.getElementById(selectElemId);
    btnElem.disabled = false;
    removeDefaultCurrencyName(OptionElemId);
    currencyNames.forEach((currencyName) => {
        let optionElem = document.createElement('option');
        optionElem.value = currencyName;
        optionElem.innerHTML = currencyName;
        btnElem.appendChild(optionElem);
    })


}

let removeDefaultCurrencyName = (defaultOptionId) => {
    let defaultCurrencyElem = document.getElementById(defaultOptionId);
    defaultCurrencyElem.parentNode.removeChild(defaultCurrencyElem);
}

// it should get currency code given currency name
let getCurrencyId = (userCurrencyName) => {
    if (!results || !userCurrencyName) {
        showErrMsg('currency Id cannot be found Reload')
    }

    for (currencyId in results) {
        const currencyObj = results[currencyId];
        if (currencyObj.currencyName == userCurrencyName) {
            return currencyObj.id;
        }
    }

    showErrMsg('currency Id cannot be found Reload');
}

// it should return currency id given currency name
let getCurrencyIdTester1 = () => {
    const currencyName = 'United States Dollar';
    const currencyCode = getCurrencyId(currencyName);
    if (currencyCode == 'USD') {
        console.log('match found');
    }
}

// it should show an error msg if currecyId cannot be found
let getCurrencyIdTester2 = () => {
    const currencyName = undefined;
    const currencyCode = getCurrencyId(currencyName);
    if (currencyCode == 'USD') {
        console.log('match found');
    }
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
    disableBtn(fromElemId);
    disableBtn(toElemId);

    getCurrencyNames().then(currencyNames => {
        updateSelectBtn(currencyNames, fromElemId, defaultElemId);
        updateSelectBtn(currencyNames, toElemId, defaultToElemId);
    });
}
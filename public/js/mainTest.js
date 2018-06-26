// import getCurrencyNames from './main'

// it should set select button to currencyNames given currencyNames, select elem id and default option elem id
let updateSeletBtnTester1 = () => {
    const currencyNames = ['Naira', 'Dollar', 'Pounds'];
    populateSelectBtn(currencyNames, fromElemId, defaultFromElemId);
    const btnElem = document.getElementById(fromElemId);
    if (btnElem.children.length == currencyNames.length) {
        console.log('currency names appended');
    }
}

// it should enable the button if currency names is defined and not empty
let updateSeletBtnTester2 = () => {
    const currencyNames = [];
    populateSelectBtn(currencyNames, fromElemId, defaultFromElemId);
    const btnElem = document.getElementById(fromElemId);
    if (btnElem.children.length == currencyNames.length) {
        console.log('currency names appended');
    }
}

let getCurrencyNamesTester = async () => {

    const names = await getCurrencyNames();
    if (names.length > 0) {
        console.dir(names);
    } else {
        console.dir(names);
    }

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


/************** manual Tests  ************/
// it should return an array of country names

getCurrencyNamesTester();

//updateSeletBtnTester1();

// it should not activate btn if there r no currencyNames
//updateSeletBtnTester2();
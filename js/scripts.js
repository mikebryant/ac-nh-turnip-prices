//Reusable Fields
const getSellFields = function () {
  let fields = []
  for (var i = 2; i < 14; i++) {
    fields.push($("#sell_" + i)[0])
  }
  return fields
}

const getFirstBuyRadios = function () {
  return [
    $("#first-time-radio-no")[0],
    $("#first-time-radio-yes")[0]
  ];
}

const getPreviousPatternRadios = function () {
  return [
    $("#pattern-radio-unknown")[0],
    $("#pattern-radio-fluctuating")[0],
    $("#pattern-radio-small-spike")[0],
    $("#pattern-radio-large-spike")[0],
    $("#pattern-radio-decreasing")[0]
  ];
}

const getCheckedRadio = function (radio_array) {
  return radio_array.find(radio => radio.checked === true).value
}

const checkRadioByValue = function (radio_array, value) {
  radio_array.forEach(radio => radio.checked = false)
  radio_array.find(radio => radio.value == value).checked = true
}

const sell_inputs = getSellFields()
const buy_input = $("#buy")
const first_buy_radios = getFirstBuyRadios()
const previous_pattern_radios = getPreviousPatternRadios()

//Functions
const fillFields = function (prices, first_buy, previous_pattern) {
  first_buy == 'yes' ? checkRadioByValue(first_buy_radios, 'yes') : checkRadioByValue(first_buy_radios, 'no')
  checkRadioByValue(previous_pattern_radios, previous_pattern);

  buy_input.focus();
  buy_input.val(prices[0] || '')
  buy_input.blur();
  const sell_prices = prices.slice(2)

  sell_prices.forEach((price, index) => {
    if (!price) {
      return
    } else {
      const element = $("#sell_" + (index + 2));
      element.focus();
      element.val(price);
      element.blur();
    }
  })
}

const getFirstBuyState = function () {
  return JSON.parse(localStorage.getItem('first_buy')) || 'no'
}

const getPreviousPatternState = function () {
  return JSON.parse(localStorage.getItem('previous_pattern')) || 'unknown'
}

const initialize = function () {
  try {
    const prices = getPrices()
    const first_buy = getFirstBuyState();
    const previous_pattern = getPreviousPatternState();
    if (prices === null) {
      fillFields([], first_buy, previous_pattern)
    } else {
      fillFields(prices, first_buy, previous_pattern)
    }
    $(document).trigger("input");
  } catch (e) {
    console.error(e);
  }

  $("#reset").on("click", function () {
    first_buy_field.prop('checked', false);
    $("select").val(null);
    $("input").val(null).trigger("input");
  })
}

const updateLocalStorage = function (prices, first_buy, previous_pattern) {
  try {
    if (prices.length !== 14) throw "The data array needs exactly 14 elements to be valid"
    localStorage.setItem("sell_prices", JSON.stringify(prices))
    localStorage.setItem("first_buy", JSON.stringify(first_buy));
    localStorage.setItem("previous_pattern", JSON.stringify(previous_pattern));
  } catch (e) {
    console.error(e)
  }
}

const isEmpty = function (arr) {
  const filtered = arr.filter(value => value !== null && value !== '' && !isNaN(value))
  return filtered.length == 0
}

const getPricesFromLocalstorage = function () {
  try {
    const sell_prices = JSON.parse(localStorage.getItem("sell_prices"));

    if (!Array.isArray(sell_prices) || sell_prices.length !== 14) {
      return null;
    }

    return sell_prices;
  } catch (e) {
    return null;
  }
};

const getPricesFromQuery = function () {
  try {
    const params = new URLSearchParams(window.location.search.substr(1));
    const sell_prices = params.get("prices").split(".").map((x) => parseInt(x, 10));

    if (!Array.isArray(sell_prices) || sell_prices.length !== 14) {
      return null;
    }

    window.price_from_query = true;
    return sell_prices;
  } catch (e) {
    return null;
  }
};

const getPrices = function () {
  return getPricesFromQuery() || getPricesFromLocalstorage();
};

const getSellPrices = function () {
  //Checks all sell inputs and returns an array with their values
  return res = sell_inputs.map(function (input) {
    return parseInt(input.value || '');
  })
}

const calculateOutput = function (data) {
  if (isEmpty(data)) {
    $("#output").html("");
    return;
  }
  let output_possibilities = "";
  for (let poss of analyze_possibilities(data)) {
    var out_line = "<tr><td class='table-pattern'>" + poss.pattern_description + "</td>"
    out_line += `<td>${Number.isFinite(poss.probability) ? ((poss.probability * 100).toPrecision(3) + '%') : '—'}</td>`;
    for (let day of poss.prices.slice(1)) {
      if (day.min !== day.max) {
        out_line += `<td>${day.min} to ${day.max}</td>`;
      } else {
        out_line += `<td>${day.min}</td>`;
      }
    }
    out_line += `<td>${poss.weekMin}</td><td>${poss.weekMax}</td></tr>`;
    output_possibilities += out_line
  }

  $("#output").html(output_possibilities)
}

const convertPatternToInt = function (pattern) {
  switch (pattern) {
    case 'unknown':
      return -1;
    case 'fluctuating':
      return 0;
    case 'large-spike':
      return 1;
    case 'decreasing':
      return 2;
    case 'small-spike':
      return 3;
    default:
      return -1;
  }
}

const update = function () {
  const sell_prices = getSellPrices();
  const buy_price = parseInt(buy_input.val());
  const first_buy = getCheckedRadio(first_buy_radios);
  const first_buy_boolean = first_buy == 'yes'
  const previous_pattern = getCheckedRadio(previous_pattern_radios);


  buy_input[0].disabled = first_buy_boolean;
  buy_input[0].placeholder = first_buy_boolean ? '—' : '...'

  const prices = [buy_price, buy_price, ...sell_prices];

  if (!window.price_from_query) {
    updateLocalStorage(prices, first_buy, previous_pattern);
  }
  calculateOutput(prices, first_buy_boolean, convertPatternToInt(previous_pattern));
}

$(document).ready(initialize);
$(document).on("input", update);
$('input[type = radio]').on("change", update);
//Reusable Fields
const getSellFields = function () {
  let fields = [];
  for (var i = 2; i < 14; i++) {
    fields.push($("#sell_" + i)[0]);
  }
  return fields;
};

const getFirstBuyRadios = function () {
  return [
    $("#first-time-radio-no")[0],
    $("#first-time-radio-yes")[0]
  ];
};

const getPreviousPatternRadios = function () {
  return [
    $("#pattern-radio-unknown")[0],
    $("#pattern-radio-fluctuating")[0],
    $("#pattern-radio-small-spike")[0],
    $("#pattern-radio-large-spike")[0],
    $("#pattern-radio-decreasing")[0]
  ];
};

const getCheckedRadio = function (radio_array) {
  return radio_array.find(radio => radio.checked === true).value;
};

const checkRadioByValue = function (radio_array, value) {
  if (value === null) {
    return;
  }
  value = value.toString();
  radio_array.find(radio => radio.value == value).checked = true;
};

const state = {
  initialized: false,
};

const sell_inputs = getSellFields();
const buy_input = $("#buy");
const first_buy_radios = getFirstBuyRadios();
const previous_pattern_radios = getPreviousPatternRadios();
const permalink_input = $('#permalink-input');
const permalink_button = $('#permalink-btn');
const snackbar = $('#snackbar');

//Functions
const fillFields = function (prices, first_buy, previous_pattern) {
  checkRadioByValue(first_buy_radios, first_buy);
  checkRadioByValue(previous_pattern_radios, previous_pattern);

  buy_input.focus();
  buy_input.val(prices[0] || '');
  buy_input.blur();
  const sell_prices = prices.slice(2);

  sell_prices.forEach((price, index) => {
    if (!price) {
      return;
    } else {
      const element = $("#sell_" + (index + 2));
      element.focus();
      element.val(price);
      element.blur();
    }
  });
};

const initialize = function () {
  try {
    const previous = getPrevious();
    const first_buy = previous[0];
    const previous_pattern = previous[1];
    const prices = previous[2];
    if (prices === null) {
      fillFields([], first_buy, previous_pattern);
    } else {
      fillFields(prices, first_buy, previous_pattern);
    }
  } catch (e) {
    console.error(e);
  }

  $(document).trigger("input");

  $("#permalink-btn").on("click", copyPermalink);

  $("#reset").on("click", function () {
    if (window.confirm(i18next.t("prices.reset-warning"))) {
      sell_inputs.forEach(input => input.value = '');
      fillFields([], false, -1);
      update();
    }
  });

  console.log('finished initializing');
  state.initialized = true;
};

const updateLocalStorage = function (prices, first_buy, previous_pattern) {
  try {
    if (prices.length !== 14) throw "The data array needs exactly 14 elements to be valid";
    localStorage.setItem("sell_prices", JSON.stringify(prices));
    localStorage.setItem("first_buy", JSON.stringify(first_buy));
    localStorage.setItem("previous_pattern", JSON.stringify(previous_pattern));
  } catch (e) {
    console.error(e);
  }
};

const isEmpty = function (arr) {
  const filtered = arr.filter(value => value !== null && value !== '' && !isNaN(value));
  return filtered.length == 0;
};

const getFirstBuyStateFromQuery = function (param) {
  try {
    const params = new URLSearchParams(window.location.search.substr(1));
    const firstbuy_str = params.get(param);

    if (firstbuy_str == null) {
      return null;
    }

    firstbuy = null;
    if (firstbuy_str == "1" || firstbuy_str == "yes" || firstbuy_str == "true") {
      firstbuy = true;
    } else if (firstbuy_str == "0" || firstbuy_str == "no" || firstbuy_str == "false") {
      firstbuy = false;
    }

    return firstbuy;

  } catch (e) {
    return null;
  }
};

const getFirstBuyStateFromLocalstorage = function () {
  return JSON.parse(localStorage.getItem('first_buy'));
};

const getPreviousPatternStateFromLocalstorage = function () {
  return JSON.parse(localStorage.getItem('previous_pattern'));
};

const getPreviousPatternStateFromQuery = function (param) {
  try {
    const params = new URLSearchParams(window.location.search.substr(1));
    const pattern_str = params.get(param);

    if (pattern_str == null) {
      return null;
    }

    if (pattern_str == "0" || pattern_str == "fluctuating") {
      pattern = 0;
    } else if (pattern_str == "1" || pattern_str == "large-spike") {
      pattern = 1;
    } else if (pattern_str == "2" || pattern_str == "decreasing") {
      pattern = 2;
    } else if (pattern_str == "3" || pattern_str == "small-spike") {
      pattern = 3;
    } else {
      pattern = -1;
    }

    return pattern;

  } catch (e) {
    return null;
  }
};

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

const getPricesFromQuery = function (param) {
  try {
    const params = new URLSearchParams(window.location.search.substr(1));
    const sell_prices = params.get(param).split(".").map((x) => parseInt(x, 10));

    if (!Array.isArray(sell_prices)) {
      return null;
    }

    // Parse the array which is formatted like: [price, M-AM, M-PM, T-AM, T-PM, W-AM, W-PM, Th-AM, Th-PM, F-AM, F-PM, S-AM, S-PM, Su-AM, Su-PM]
    // due to the format of local storage we need to double up the price at the start of the array.
    sell_prices.unshift(sell_prices[0]);

    // This allows us to fill out the missing fields at the end of the array
    for (let i = sell_prices.length; i < 14; i++) {
      sell_prices.push(0);
    }

    return sell_prices;
  } catch (e) {
    return null;
  }
};

const getPreviousFromQuery = function () {
  /* Check if valid prices are entered. Exit immediately if not. */
  const prices = getPricesFromQuery("prices");
  if (prices == null) {
    return null;
  }

  console.log("Using data from query.");
  window.populated_from_query = true;
  return [
    getFirstBuyStateFromQuery("first"),
    getPreviousPatternStateFromQuery("pattern"),
    prices
  ];
};

const getPreviousFromLocalstorage = function () {
  return [
    getFirstBuyStateFromLocalstorage(),
    getPreviousPatternStateFromLocalstorage(),
    getPricesFromLocalstorage()
  ];
};


/**
 * Gets previous values. First tries to parse parameters,
 * if none of them match then it looks in local storage.
 * @return {[first time, previous pattern, prices]}
 */
const getPrevious = function () {
  return getPreviousFromQuery() || getPreviousFromLocalstorage();
};

const getSellPrices = function () {
  //Checks all sell inputs and returns an array with their values
  return res = sell_inputs.map(function (input) {
    return parseInt(input.value || '');
  });
};

const getPriceClass = function(buy_price, max) {
  const priceBrackets = [200, 30, 0, -30, -99];
  let diff = max - buy_price;
  for(var i=0; i<priceBrackets.length; i++) {
    if(diff >= priceBrackets[i]) {
      return "range" + i;
    }
  }
  return "";
};

const displayPercentage = function(fraction) {
  if (Number.isFinite(fraction)) {
    let percent = fraction * 100;
    if (percent >= 1) {
      return percent.toPrecision(3) + '%';
    } else if (percent >= 0.01) {
      return percent.toFixed(2) + '%';
    } else {
      return '<0.01%';
    }
  } else {
    return '—';
  }
};

const calculateOutput = function (data, first_buy, previous_pattern) {
  if (isEmpty(data)) {
    $("#output").html("");
    $("#betterLabel").html("");
    return;
  }
  let pat_desc = {0:"fluctuating", 1:"large-spike", 2:"decreasing", 3:"small-spike", 4:"all"};
  let output_possibilities = "";
  let predictor = new Predictor(data, first_buy, previous_pattern);
  let analyzed_possibilities = predictor.analyze_possibilities();
  let buy_price = parseInt(buy_input.val());
  previous_pattern_number = "";
  for (let poss of analyzed_possibilities) {
    var out_line = "<tr><td class='table-pattern'>" + i18next.t("patterns." + pat_desc[poss.pattern_number])  + "</td>";
    const style_price = buy_price || poss.prices[0].min;
    if (previous_pattern_number != poss.pattern_number) {
      previous_pattern_number = poss.pattern_number;
      pattern_count = analyzed_possibilities
        .filter(val => val.pattern_number == poss.pattern_number)
        .length;
      out_line += `<td rowspan=${pattern_count}>${displayPercentage(poss.category_total_probability)}</td>`;
    }
    out_line += `<td>${displayPercentage(poss.probability)}</td>`;
    for (let day of poss.prices.slice(2)) {
      let price_class = getPriceClass(style_price, day.max);
      if (day.min !== day.max) {
        out_line += `<td class='${price_class}'>${day.min} ${i18next.t("output.to")} ${day.max}</td>`;
      } else {
        out_line += `<td class='${price_class}'>${day.min}</td>`;
      }
    }

    var min_class = getPriceClass(style_price, poss.weekGuaranteedMinimum);
    var max_class = getPriceClass(style_price, poss.weekMax);
    out_line += `<td class='${min_class}'>${poss.weekGuaranteedMinimum}</td><td class='${max_class}'>${poss.weekMax}</td></tr>`;
    output_possibilities += out_line;
  }

  $("#output").html(output_possibilities);

  update_chart(data, analyzed_possibilities);

  update_sellnow(data, analyzed_possibilities);

};

const update_sellnow = function(prices, patterns) {

  // get today info
  let now = new Date();
  let now_index = now.getDay() * 2 + (now.getHours() >= 12 ? 1 : 0); // this is today's index

  let label = '';

  if (patterns.length == 1) {
    // invalid data
    label = "---"
  } else if (now_index <= 1) {
    // sunday
    label = i18next.t("output.better.cant")
  } else if (isNaN(prices[now_index])) {
    // no today's price
    label = i18next.t("output.better.no-data")
  } else {
    // calculate

    let now_price = prices[now_index]; // this is the base price
    var prob = 1 - patterns // probability of better is 1 minus probability of worst
      .slice(1) // discard the combined pattern (first in the list)
      .map(pattern => { // calculate probability of each pattern
        return pattern.probability * pattern.prices // as the probability of this pattern times probability of all worst values
          .slice(now_index + 1) // starting from tomorrow
          .map(day => { // calculate probability of each day
            if (day.min >= now_price) return 0; // if the minimum possible is already greater than now, we will always have a greater value
            else if (day.max < now_price) return 1; // if the maximum possible is already lower than now, we will always have a lower value
            else return (now_price - day.min) / (day.max - day.min + 1); // otherwise, the probability is the percentage of the low interval
          }).reduce((acc, e) => acc * e, 1); // the probability of a pattern is the multiplications of each day
      }).reduce((acc, e) => acc + e, 0); // the total probability is the addition of each pattern (already normalized)

    // generate label
    let probNumber = prob == 0 ? "0%" : displayPercentage(prob);
    let probLabel = i18next.t(
      prob >= 0.9 ? "output.better.no" :
      prob >= 0.5 ? "output.better.prob-no" :
      prob >= 0.1 ? "output.better.prob-yes" :
      "output.better.yes"
    );
    label = `${probLabel} - ${i18next.t("output.better.details")} ${probNumber}`
  }

  // update
  $("#betterLabel").html(label);
};

const generatePermalink = function (buy_price, sell_prices, first_buy, previous_pattern) {
  let searchParams = new URLSearchParams();
  let pricesParam = buy_price ? buy_price.toString() : '';

  if (!isEmpty(sell_prices)) {
    const filtered = sell_prices.map(price => isNaN(price) ? '' : price).join('.');
    pricesParam = pricesParam.concat('.', filtered);
  }

  if (pricesParam) {
    searchParams.append('prices', pricesParam);
  }

  if (first_buy) {
    searchParams.append('first', true);
  }

  if (previous_pattern !== -1) {
    searchParams.append('pattern', previous_pattern);
  }

  return searchParams.toString() && window.location.origin.concat('?', searchParams.toString());
};

const copyPermalink = function () {
  let text = permalink_input[0];

  permalink_input.show();
  text.select();
  text.setSelectionRange(0, 99999); /* for mobile devices */

  document.execCommand('copy');
  permalink_input.hide();

  flashMessage(i18next.t("prices.permalink-copied"));
};

const flashMessage = function(message) {
  snackbar.text(message);
  snackbar.addClass('show');

  setTimeout(function () {
    snackbar.removeClass('show');
    snackbar.text('');
  }, 3000);
};

const update = function () {
  if(!state.initialized){
    console.log('update function called before initial data load');
    // calls to update before the previous data has been initialized / loaded will reset the data.
    return;
  }
  const sell_prices = getSellPrices();
  const buy_price = parseInt(buy_input.val());
  const first_buy = getCheckedRadio(first_buy_radios) == 'true';
  const previous_pattern = parseInt(getCheckedRadio(previous_pattern_radios));

  const permalink = generatePermalink(buy_price, sell_prices, first_buy, previous_pattern);
  if (permalink) {
    permalink_button.show();
  } else {
    permalink_button.hide();
  }
  permalink_input.val(permalink);

  const prices = [buy_price, buy_price, ...sell_prices];

  if (!window.populated_from_query) {
    updateLocalStorage(prices, first_buy, previous_pattern);
  }

  calculateOutput(prices, first_buy, previous_pattern);
};

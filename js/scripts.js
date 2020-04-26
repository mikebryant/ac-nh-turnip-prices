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

const sell_inputs = getSellFields();
const buy_input = $("#buy");
const first_buy_radios = getFirstBuyRadios();
const previous_pattern_radios = getPreviousPatternRadios();
const permalink_input = $('#permalink-input');
const permalink_button = $('#permalink-btn');
const snackbar = $('#snackbar');
const islandname_input = $('#island'),
multiIsland = new MultiIsland();
//Functions
const fillFields = function (prices, first_buy, previous_pattern, island_name) {
  checkRadioByValue(first_buy_radios, first_buy);
  checkRadioByValue(previous_pattern_radios, previous_pattern);

  buy_input.focus();
  buy_input.val(prices[0] || '');
  buy_input.blur();
  islandname_input.val(island_name || '');
  const sell_prices = prices.slice(2);
  sell_inputs.forEach((sell_input, index) => {
    if (!sell_prices[index]) {
      sell_input.value = '';
    } else {
      sell_input.value = sell_prices[index];
    }
  });
};

const fillFieldsByIsland = function (island) {
  fillFields(island.prices, island.isfirst, island.pattern, island.name);
};

const updateMultiIslandSelector = function () {
  const islandGroup = $('.island-group'),
  maxIslandNum = 5,
  islandCount = multiIsland.getIslandCount();
  islandGroup.empty();
  if (multiIsland.islandIndex > maxIslandNum - 1 || multiIsland.islandIndex > islandCount - 1) {
    multiIsland.setCurrentIsland();
  }
  for (let i = 0; i < islandCount; i++) {
    if (i > maxIslandNum - 1)
      break;
    let islandName = multiIsland.getIslandData(i).name;
    islandGroup.append(`<div class="island-selector${!window.populated_from_query && multiIsland.islandIndex == i ? ' island-selected' : ''}" data-index="${i}">${islandName != '' ? islandName : i + 1}</div>`);
    if (i >= islandCount - 1 && islandCount < maxIslandNum) {
      islandGroup.append(`<div class="island-selector-add${window.populated_from_query ? ' shared-data' : ''}">➕</div>`);
    }
  }
}

const initialize = function () {
  try {
    fillFieldsByIsland(getPrevious());
  } catch (e) {
    console.error(e);
  }

  updateContent();
  if (window.populated_from_query) {
    $('input').prop('disabled', true);
    $('.button--reset').prop('disabled', true);
  }
  updateMultiIslandSelector();

  $("#permalink-btn").on("click", copyPermalink);

  $("#reset").on("click", () => {
    if (window.confirm(i18next.t("prices.reset-warning"))) {
      multiIsland.removeIslandDataAll();
      fillFieldsByIsland(multiIsland.getIslandData());
      update();
      updateMultiIslandSelector();
    }
  });

  $("#delete").on("click", () => {
    if (window.confirm(i18next.t("islands.delete-warning"))) {
      multiIsland.removeIslandData(multiIsland.islandIndex);
      fillFieldsByIsland(multiIsland.getIslandData());
      update();
      updateMultiIslandSelector();
    }
  });

  islandname_input.on('change', () => {
    update(true);
    updateMultiIslandSelector();
  });

  $('.island-group').on('click', '.island-selector', (event) => {
    if (window.populated_from_query) {
      history.pushState(null, null, window.location.origin.concat(window.location.pathname));
      window.populated_from_query = false;
      $('input').prop('disabled', false);
      $('.button--reset').prop('disabled', false);
      $('.island-selector-add.shared-data').removeClass('shared-data');
    }
    let islandBtn = $(event.currentTarget);
    multiIsland.setCurrentIsland(islandBtn.attr('data-index'));
    $('.island-group .island-selector').removeClass('island-selected');
    islandBtn.addClass('island-selected');
    fillFieldsByIsland(multiIsland.getIslandData());
    update();
  }).on('click', '.island-selector-add', () => {
    if (!window.populated_from_query) {
      multiIsland.addIslandData();
    } else {
      multiIsland.addIsland(getPreviousFromQuery());
      history.pushState(null, null, window.location.origin.concat(window.location.pathname));
      window.populated_from_query = false;
      $('input').prop('disabled', false);
      $('.button--reset').prop('disabled', false);
    }
    multiIsland.setCurrentIsland(multiIsland.getIslandCount() - 1);
    fillFieldsByIsland(multiIsland.getIslandData());
    update();
    updateMultiIslandSelector();
  });

  let istap;
  $('.island-toggle').on({
    'mouseenter': () => {
      $('.island-group').stop().slideDown(100);
    },
    'touchstart': () => {
      istap = true;
    },
    'touchmove': () => {
      istap = false;
    },
    'touchend': (e) => {
      if (istap) {
        if ($('.island-group').is(':visible')) {
          $('.island-group').stop().slideUp(100);
        } else {
          $('.island-group').stop().slideDown(100);
        }
      }
      e.cancelable && e.preventDefault();
    }
  });
  $('.island-menu').on(
    'mouseleave', () => {
    $('.island-group').stop().slideUp(100);
  })
};

const isEmpty = function (arr) {
  const filtered = arr.filter(value => value !== null && value !== '' && !isNaN(value))
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

const getIslandNameFromQuery = function () {
  try {
    let islandName = new URLSearchParams(window.location.search.substr(1)).get('island');
    if (!islandName)
      return null;
    return $.trim(decodeURIComponent(islandName));
  } catch (e) {
    return null;
  }
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
  return new Island(
    prices,
    getFirstBuyStateFromQuery("first"),
    getPreviousPatternStateFromQuery("pattern"),
    getIslandNameFromQuery());
};

/**
 * Gets previous values. First tries to parse parameters,
 * if none of them match then it looks in local storage.
 * @return {first time, previous pattern, prices ,island name}
 */
const getPrevious = function () {
  return getPreviousFromQuery() || multiIsland.getIslandData();
};

const getSellPrices = function () {
  //Checks all sell inputs and returns an array with their values
  return res = sell_inputs.map(function (input) {
    return parseInt(input.value || '');
  })
};

const getPriceClass = function (buy_price, max) {
  const priceBrackets = [200, 30, 0, -30, -99];
  let diff = max - buy_price;
  for (var i = 0; i < priceBrackets.length; i++) {
    if (diff >= priceBrackets[i]) {
      return "range" + i;
    }
  }
  return "";
};

const calculateOutput = function (data, first_buy, previous_pattern) {
  if (isEmpty(data)) {
    $("#output").html("");
    return;
  }
  let output_possibilities = "";
  let predictor = new Predictor(data, first_buy, previous_pattern);
  let analyzed_possibilities = predictor.analyze_possibilities();
  let buy_price = parseInt(buy_input.val());
  previous_pattern_number = ""
    for (let poss of analyzed_possibilities) {
      var out_line = "<tr><td class='table-pattern'>" + poss.pattern_description + "</td>"
        if (previous_pattern_number != poss.pattern_number) {
          previous_pattern_number = poss.pattern_number
            pattern_count = analyzed_possibilities
            .filter(val => val.pattern_number == poss.pattern_number)
            .length
            percentage_display = percent => Number.isFinite(percent) ? ((percent * 100).toPrecision(3) + '%') : '—'
            out_line += `<td rowspan=${pattern_count}>${percentage_display(poss.category_total_probability)}</td>`;
        }
        out_line += `<td>${percentage_display(poss.probability)}</td>`;
      for (let day of poss.prices.slice(1)) {
        let price_class = getPriceClass(buy_price, day.max);
        if (day.min !== day.max) {
          out_line += `<td class='${price_class}'>${day.min} ${i18next.t("output.to")} ${day.max}</td>`;
        } else {
          out_line += `<td class='${price_class}'>${day.min}</td>`;
        }
      }

      var min_class = getPriceClass(buy_price, poss.weekGuaranteedMinimum);
      var max_class = getPriceClass(buy_price, poss.weekMax);
      out_line += `<td class='${min_class}'>${poss.weekGuaranteedMinimum}</td><td class='${max_class}'>${poss.weekMax}</td></tr>`;
      output_possibilities += out_line
    }

    $("#output").html(output_possibilities)

    update_chart(data, analyzed_possibilities);
};

const generatePermalink = function (buy_price, sell_prices, first_buy, previous_pattern, island_name) {
  let searchParams = new URLSearchParams(),
  pricesParam = buy_price ? buy_price.toString() : '',
  islandName = encodeURIComponent($.trim(island_name));

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

  if (islandName != '') {
    searchParams.append('island', islandName);
  }

  return searchParams.toString() && window.location.origin.concat(window.location.pathname, '?', searchParams.toString());
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

const flashMessage = function (message) {
  snackbar.text(message);
  snackbar.addClass('show');

  setTimeout(function () {
    snackbar.removeClass('show')
    snackbar.text('');
  }, 3000);
};

const update = function (skipCalc) {
  const sell_prices = getSellPrices();
  const buy_price = parseInt(buy_input.val());
  const first_buy = getCheckedRadio(first_buy_radios) == 'true';
  const previous_pattern = parseInt(getCheckedRadio(previous_pattern_radios));
  const island_name = islandname_input.val();

  buy_input[0].disabled = first_buy;
  buy_input[0].placeholder = first_buy ? '—' : '...';

  const permalink = generatePermalink(buy_price, sell_prices, first_buy, previous_pattern, island_name);
  if (permalink) {
    permalink_button.show();
  } else {
    permalink_button.hide();
  }
  permalink_input.val(permalink);

  const prices = [buy_price, buy_price, ...sell_prices];

  if (!window.populated_from_query) {
    multiIsland.setIslandData(prices, first_buy, previous_pattern, island_name);
  }
  if (skipCalc)
    return;
  calculateOutput(prices, first_buy, previous_pattern);
};

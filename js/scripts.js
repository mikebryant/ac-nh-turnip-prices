//Reusable Fields
const getSellFields = function () {
  let fields = []
  for (var i = 2; i < 14; i++) {
    fields.push($("#sell_" + i)[0])
  }
  return fields
}

const sell_inputs = getSellFields()
const buy_input = $("#buy")
const first_buy_field = $("#first_buy");
const previous_pattern_field = $("#previous_pattern");

//Functions
const fillFields = function (prices, previous_pattern, first_buy) {
  previous_pattern_field.val(previous_pattern);
  first_buy_field.prop("checked", first_buy);

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

const initialize = function () {
  try {
    const prices = getPrices();
    const previous_pattern = getPreviousPatternState();
    const first_buy = getFirstBuyState();
    if (prices === null) {
      fillFields([], previous_pattern, first_buy)
    } else {
      fillFields(prices, previous_pattern, first_buy)
    }
    $(document).trigger("input");
  } catch (e) {
    console.error(e);
  }

  $("#reset").on("click", function () {
    previous_pattern_field.val("");
    first_buy_field.prop('checked', false);
    $("input").val(null).trigger("input");
  })
}

const updateLocalStorage = function (prices, previous_pattern, first_buy) {
  try {
    if (prices.length !== 14) throw "The data array needs exactly 14 elements to be valid"
    localStorage.setItem("sell_prices", JSON.stringify(prices));
    localStorage.setItem("previous_pattern", JSON.stringify(previous_pattern));
    localStorage.setItem("first_buy", JSON.stringify(first_buy));
  } catch (e) {
    console.error(e)
  }
}

const isEmpty = function (arr) {
  const filtered = arr.filter(value => value !== null && value !== '' && !isNaN(value))
  return filtered.length == 0
}

const getFirstBuyState = function () {
  return JSON.parse(localStorage.getItem('first_buy'))
}

const getPreviousPatternState = function () {
  return JSON.parse(localStorage.getItem('previous_pattern'))
}

const getPrices = function () {
  let prices = JSON.parse(localStorage.getItem("sell_prices"))
  if (!prices || isEmpty(prices) || prices.length !== 14) {
    return null
  } else {
    return prices
  }
}

const getSellPrices = function () {
  //Checks all sell inputs and returns an array with their values
  return res = sell_inputs.map(function (input) {
    return parseInt(input.value || '');
  })
}

const calculateOutput = function (data, previous_pattern, first_buy) {
  if (isEmpty(data)) {
    $("#output").html("");
    return;
  }

  let possibilities = analyze_possibilities(data, previous_pattern, first_buy);
  let output_possibilities = "";
  let prob_types = new Map();
  for (let poss of possibilities) {
      if (poss.probability !== 100) { // not predicted min/max
          prob_types.set(poss.pattern_description, poss.probability)
      }
  }
  let prob_total = 0;
  prob_types.forEach(function(v) {
      prob_total += v
  })
  for (let poss of possibilities) {
    var out_line = "<tr><td>" + poss.pattern_description + "</td>"
    for (let day of poss.prices.slice(1)) {
      if (day.min !== day.max) {
        out_line += `<td>${day.min}..${day.max}</td>`;
      } else {
        out_line += `<td class="one">${day.min}</td>`;
      }
    }
    out_line += `<td class="one">${poss.weekMin}</td><td class="one">${poss.weekMax}</td>`;
    if (poss.probability === 0 || poss.probability === 100) {
      out_line += `<td class="one">N/A</td></tr>`;
    } else {
      out_line += `<td class="one">${((poss.probability/prob_total)*100).toFixed(2)}%</td></tr>`;
    }
    output_possibilities += out_line
  }

  $("#output").html(output_possibilities)
}

const update = function () {
  const sell_prices = getSellPrices();
  const buy_price = parseInt(buy_input.val());
  const previous_pattern = previous_pattern_field.val();
  const first_buy = first_buy_field.is(":checked");

  buy_input.prop('disabled', first_buy);

  const prices = [buy_price, buy_price, ...sell_prices];
  updateLocalStorage(prices, previous_pattern, first_buy);
  calculateOutput(prices, previous_pattern, first_buy);
}

$(document).ready(initialize);
$(document).on("input", update);

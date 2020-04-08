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
const previous_pattern_input = $("#previous_pattern");

//Functions
const fillFields = function (prices, first_buy, previous_pattern) {
  first_buy_field.prop("checked", first_buy);
  previous_pattern_input.val(previous_pattern);

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

  $('select').formSelect();
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

const calculateOutput = function (data, first_buy, previous_pattern) {
  if (isEmpty(data)) {
    $("#output").html("");
    return;
  }
  let output_possibilities = "";
  for (let poss of analyze_possibilities(data, first_buy, previous_pattern)) {
    var out_line = "<tr><td>" + poss.pattern_description + "</td>"
    out_line += `<td>${Number.isFinite(poss.probability) ? ((poss.probability * 100).toPrecision(3) + '%') : '—'}</td>`;
    for (let day of poss.prices.slice(1)) {
      if (day.min !== day.max) {
        out_line += `<td>${day.min}..${day.max}</td>`;
      } else {
        out_line += `<td class="one">${day.min}</td>`;
      }
    }
    out_line += `<td class="one">${poss.weekMin}</td><td class="one">${poss.weekMax}</td></tr>`;
    output_possibilities += out_line
  }

  $("#output").html(output_possibilities)
}

const update = function () {
  const sell_prices = getSellPrices();
  const buy_price = parseInt(buy_input.val());
  const first_buy = first_buy_field.is(":checked");
  const previous_pattern = parseInt(previous_pattern_input.val());

  buy_input.prop('disabled', first_buy);

  const prices = [buy_price, buy_price, ...sell_prices];
  updateLocalStorage(prices, first_buy, previous_pattern);
  calculateOutput(prices, first_buy, previous_pattern);
}

$(document).ready(initialize);
$(document).on("input", update);
$(previous_pattern_input).on("change", update);

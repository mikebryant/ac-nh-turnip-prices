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


//Functions
const fillFields = function (prices) {
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
    console.log("Prices from Storage", prices)
    if (prices === null) {
      return
    } else {
      fillFields(prices)
    }
    $(document).trigger("input");
  } catch (e) {
    console.error(e);
  }

  $("#reset").on("click", function () {
    $("input").val(null).trigger("input");
  })
}

const updateLocalStorage = function (data) {
  try {
    if (data.length !== 14) throw "The data array needs exactly 14 elements to be valid"
    localStorage.setItem("sell_prices", JSON.stringify(data))
  } catch (e) {
    console.error(e)
  }
}

const isEmpty = function (arr) {
  const filtered = arr.filter(value => value !== null && value !== '' && !isNaN(value))
  return filtered.length == 0
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

const calculateOutput = function (data) {
  if (isEmpty(data)) {
    $("#output").html("");
    return;
  }
  let output_possibilities = "";
  for (let poss of analyze_possibilities(data)) {
    var out_line = "<tr><td>" + poss.pattern_description + "</td>"
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
  const data = [buy_price, buy_price, ...sell_prices];
  updateLocalStorage(data);
  calculateOutput(data);
}

$(document).ready(initialize);
$(document).on("input", update);

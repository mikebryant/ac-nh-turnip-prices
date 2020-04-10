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
  return radio_array.find(radio => radio.checked === true).value;
}

const checkRadioByValue = function (radio_array, value) {
  if (value === null) {
    return;
  }
  value = value.toString();
  radio_array.find(radio => radio.value == value).checked = true;
}

const sell_inputs = getSellFields()
const buy_input = $("#buy")
const first_buy_radios = getFirstBuyRadios()
const previous_pattern_radios = getPreviousPatternRadios()

//Functions
const fillFields = function (prices, first_buy, previous_pattern) {
  checkRadioByValue(first_buy_radios, first_buy);
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
    sell_inputs.forEach(input => input.value = '')
    fillFields([], false, -1)
    update()
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

const getFirstBuyState = function () {
  return JSON.parse(localStorage.getItem('first_buy'))
}

const getPreviousPatternState = function () {
  return JSON.parse(localStorage.getItem('previous_pattern'))
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

const calculateOutput = function (data, first_buy, previous_pattern) {
  if (isEmpty(data)) {
    $("#output").html("");
    return;
  }
  let output_possibilities = "";
  let possibilities = analyze_possibilities(data, first_buy, previous_pattern)
  for (let poss of possibilities) {
    var out_line = "<tr><td class='table-pattern'>" + poss.pattern_description + "</td>"
    out_line += `<td>${Number.isFinite(poss.probability) ? ((poss.probability * 100).toPrecision(3) + '%') : '—'}</td>`;
    for (let day of poss.prices.slice(1)) {
      if (day.min !== day.max) {
        out_line += `<td>${day.min} to ${day.max}</td>`;
      } else {
        out_line += `<td>${day.min}</td>`;
      }
    }
    out_line += `<td>${poss.weekGuaranteedMinimum}</td><td>${poss.weekMax}</td></tr>`;
    output_possibilities += out_line
  }

  $("#output").html(output_possibilities)

  updateGraph(data, possibilities);
}

const update = function () {
  const sell_prices = getSellPrices();
  const buy_price = parseInt(buy_input.val());
  const first_buy = getCheckedRadio(first_buy_radios) == 'true';
  const previous_pattern = parseInt(getCheckedRadio(previous_pattern_radios));

  buy_input[0].disabled = first_buy;
  buy_input[0].placeholder = first_buy ? '—' : '...'

  const prices = [buy_price, buy_price, ...sell_prices];

  if (!window.price_from_query) {
    updateLocalStorage(prices, first_buy, previous_pattern);
  }

  calculateOutput(prices, first_buy, previous_pattern);
}

const chartOptions = {
  maintainAspectRatio: false,
  showLines: true,
  tooltips: {
    intersect: false,
    mode: "index",
  },
  scales: {
    yAxes: [
      {
        gridLines: {
          display: false,
        },
        ticks: {
          suggestedMin: 0,
          suggestedMax: 300,
        },
      },
    ],
  },
  elements: {
    line: {
      cubicInterpolationMode: "monotone",
    },
  },
};

const getLabels = () => {
  return "Mon Tue Wed Thu Fri Sat"
      .split(" ")
      .reduce(
          (acc, day) => [...acc, `${day} ${"AM"}`, `${day} ${"PM"}`],
          []
      );
};


let chart = null
const updateGraph = function(datas, possibilities) {
  let all_possibilities = possibilities.slice(-1).pop()
  let buy_price = datas[0]
  let inputDatas = datas.slice(2)
  let prices = all_possibilities.prices.slice(2)
  let mins = prices.map(value => value.min);
  let maxs = prices.map(value => value.max);

  let average = Array()
  for (let i = 0; i <= 11; i++) {
    average.push(Math.floor((mins[i] + maxs[i]) / 2))
  }

  let datasets = [
    {
      label: "Buy Price",
      data: new Array(12).fill(buy_price || null),
      fill: true,
      backgroundColor: "transparent",
      borderColor: "#7B6C53",
      pointRadius: 0,
      pointHoverRadius: 0,
      borderDash: [5, 15],
    },
    {
      label: "Guaranteed Min",
      data: new Array(12).fill(all_possibilities.weekGuaranteedMinimum || null),
      fill: true,
      backgroundColor: "transparent",
      borderColor: "#007D75",
      pointRadius: 0,
      pointHoverRadius: 0,
      borderDash: [3, 6],
    },
    {
      label: "Daily Price",
      data: inputDatas,
      fill: false,
      backgroundColor: "#EF8341",
      borderColor: "#EF8341",
    },
    {
      label: "Average",
      data: average,
      backgroundColor: "#F0E16F",
      borderColor: "#F0E16F",
      pointRadius: 0,
      fill: false,
    },
    {
      label: "Maximum",
      data: maxs || new Array(12).fill(null),
      backgroundColor: "#A5D5A5",
      borderColor: "#A5D5A5",
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: 3,
    },
    {
      label: "Minimum",
      data: mins || new Array(12).fill(null),
      backgroundColor: "#88C9A1",
      borderColor: "#88C9A1",
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: 3,
    },
  ];

  const ctx = document.getElementById('chart').getContext("2d");
  if (!chart) {
    chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: datasets,
        labels: getLabels(),
      },
      options: chartOptions,
    });
  } else {
    chart.data.datasets = datasets;
    chart.update()
  }
}

$(document).ready(initialize);
$(document).on("input", update);
$('input[type = radio]').on("change", update);

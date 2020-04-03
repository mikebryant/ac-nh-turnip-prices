function minimum_rate_from_given_and_base(given_price, buy_price) {
  return 10000 * (given_price - 1) / buy_price;
}

function maximum_rate_from_given_and_base(given_price, buy_price) {
  return 10000 * given_price / buy_price;
}

function* generate_pattern_0_with_lengths(given_prices, high_phase_1_len, dec_phase_1_len, high_phase_2_len, dec_phase_2_len, high_phase_3_len) {
    /*
      // PATTERN 0: high, decreasing, high, decreasing, high
      work = 2;


      // high phase 1
      for (int i = 0; i < hiPhaseLen1; i++)
      {
        sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
      }

      // decreasing phase 1
      rate = randfloat(0.8, 0.6);
      for (int i = 0; i < decPhaseLen1; i++)
      {
        sellPrices[work++] = intceil(rate * basePrice);
        rate -= 0.04;
        rate -= randfloat(0, 0.06);
      }

      // high phase 2
      for (int i = 0; i < (hiPhaseLen2and3 - hiPhaseLen3); i++)
      {
        sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
      }

      // decreasing phase 2
      rate = randfloat(0.8, 0.6);
      for (int i = 0; i < decPhaseLen2; i++)
      {
        sellPrices[work++] = intceil(rate * basePrice);
        rate -= 0.04;
        rate -= randfloat(0, 0.06);
      }

      // high phase 3
      for (int i = 0; i < hiPhaseLen3; i++)
      {
        sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
      }
  */

  buy_price = given_prices[0];
  var predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];

  // High Phase 1
  for (var i = 2; i < 2 + high_phase_1_len; i++) {
    min_pred = Math.floor(0.9 * buy_price);
    max_pred = Math.ceil(1.4 * buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }

  // Dec Phase 1
  var min_rate = 6000;
  var max_rate = 8000;
  for (var i = 2 + high_phase_1_len; i < 2 + high_phase_1_len + dec_phase_1_len; i++) {
    min_pred = Math.floor(min_rate * buy_price / 10000);
    max_pred = Math.ceil(max_rate * buy_price / 10000);


    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
      min_rate = minimum_rate_from_given_and_base(given_prices[i], buy_price);
      max_rate = maximum_rate_from_given_and_base(given_prices[i], buy_price);
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    min_rate -= 1000;
    max_rate -= 400;
  }

  // High Phase 2
  for (var i = 2 + high_phase_1_len + dec_phase_1_len; i < 2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len; i++) {
    min_pred = Math.floor(0.9 * buy_price);
    max_pred = Math.ceil(1.4 * buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }

  // Dec Phase 2
  var min_rate = 6000;
  var max_rate = 8000;
  for (var i = 2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len; i < 2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len + dec_phase_2_len; i++) {
    min_pred = Math.floor(min_rate * buy_price / 10000);
    max_pred = Math.ceil(max_rate * buy_price / 10000);


    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
      min_rate = minimum_rate_from_given_and_base(given_prices[i], buy_price);
      max_rate = maximum_rate_from_given_and_base(given_prices[i], buy_price);
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    min_rate -= 1000;
    max_rate -= 400;
  }

  // High Phase 3
  if (2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len + dec_phase_2_len + high_phase_3_len != 14) {
    throw new Error("Phase lengths don't add up");
  }
  for (var i = 2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len + dec_phase_2_len; i < 14; i++) {
    min_pred = Math.floor(0.9 * buy_price);
    max_pred = Math.ceil(1.4 * buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }
  yield {
    pattern_description: "high, decreasing, high, decreasing, high",
    pattern_number: 0,
    prices: predicted_prices
  };
}

function* generate_pattern_0(given_prices) {
  /*
      decPhaseLen1 = randbool() ? 3 : 2;
      decPhaseLen2 = 5 - decPhaseLen1;

      hiPhaseLen1 = randint(0, 6);
      hiPhaseLen2and3 = 7 - hiPhaseLen1;
      hiPhaseLen3 = randint(0, hiPhaseLen2and3 - 1);
  */
  for (var dec_phase_1_len = 2; dec_phase_1_len < 4; dec_phase_1_len++) {
    for (var high_phase_1_len = 0; high_phase_1_len < 7; high_phase_1_len++) {
      for (var high_phase_3_len = 0; high_phase_3_len < (7 - high_phase_1_len - 1 + 1); high_phase_3_len++) {
        yield* generate_pattern_0_with_lengths(given_prices, high_phase_1_len, dec_phase_1_len, 7 - high_phase_1_len - high_phase_3_len, 5 - dec_phase_1_len, high_phase_3_len);
      }
    }
  }
}

function* generate_pattern_1_with_peak(given_prices, peak_start) {
  /*
    // PATTERN 1: decreasing middle, high spike, random low
    peakStart = randint(3, 9);
    rate = randfloat(0.9, 0.85);
    for (work = 2; work < peakStart; work++)
    {
      sellPrices[work] = intceil(rate * basePrice);
      rate -= 0.03;
      rate -= randfloat(0, 0.02);
    }
    sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
    sellPrices[work++] = intceil(randfloat(1.4, 2.0) * basePrice);
    sellPrices[work++] = intceil(randfloat(2.0, 6.0) * basePrice);
    sellPrices[work++] = intceil(randfloat(1.4, 2.0) * basePrice);
    sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
    for (; work < 14; work++)
    {
      sellPrices[work] = intceil(randfloat(0.4, 0.9) * basePrice);
    }
  */

  buy_price = given_prices[0];
  var predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];

  var min_rate = 8500;
  var max_rate = 9000;

  for (var i = 2; i < peak_start; i++) {
    min_pred = Math.floor(min_rate * buy_price / 10000);
    max_pred = Math.ceil(max_rate * buy_price / 10000);


    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
      min_rate = minimum_rate_from_given_and_base(given_prices[i], buy_price);
      max_rate = maximum_rate_from_given_and_base(given_prices[i], buy_price);
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    min_rate -= 500;
    max_rate -= 300;
  }

  // Now each day is independent of next
  min_randoms = [0.9, 1.4, 2.0, 1.4, 0.9, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4]
  max_randoms = [1.4, 2.0, 6.0, 2.0, 1.4, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9]
  for (var i = peak_start; i < 14; i++) {
    min_pred = Math.floor(min_randoms[i - peak_start] * buy_price);
    max_pred = Math.ceil(max_randoms[i - peak_start] * buy_price);

    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }
  yield {
    pattern_description: "decreasing, high spike, random lows",
    pattern_number: 1,
    prices: predicted_prices
  };
}

function* generate_pattern_1(given_prices) {
  for (var peak_start = 3; peak_start < 10; peak_start++) {
    yield* generate_pattern_1_with_peak(given_prices, peak_start);
  }
}

function* generate_pattern_2(given_prices) {
  /*
      // PATTERN 2: consistently decreasing
      rate = 0.9;
      rate -= randfloat(0, 0.05);
      for (work = 2; work < 14; work++)
      {
        sellPrices[work] = intceil(rate * basePrice);
        rate -= 0.03;
        rate -= randfloat(0, 0.02);
      }
      break;
  */


  buy_price = given_prices[0];
  var predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];

  var min_rate = 8500;
  var max_rate = 9000;
  for (var i = 2; i < 14; i++) {
    min_pred = Math.floor(min_rate * buy_price / 10000);
    max_pred = Math.ceil(max_rate * buy_price / 10000);


    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
      min_rate = minimum_rate_from_given_and_base(given_prices[i], buy_price);
      max_rate = maximum_rate_from_given_and_base(given_prices[i], buy_price);
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    min_rate -= 500;
    max_rate -= 300;
  }
  yield {
    pattern_description: "always decreasing",
    pattern_number: 2,
    prices: predicted_prices
  };
}

function* generate_pattern_3_with_peak(given_prices, peak_start) {

  /*
    // PATTERN 3: decreasing, spike, decreasing
    peakStart = randint(2, 9);

    // decreasing phase before the peak
    rate = randfloat(0.9, 0.4);
    for (work = 2; work < peakStart; work++)
    {
      sellPrices[work] = intceil(rate * basePrice);
      rate -= 0.03;
      rate -= randfloat(0, 0.02);
    }

    sellPrices[work++] = intceil(randfloat(0.9, 1.4) * (float)basePrice);
    sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
    rate = randfloat(1.4, 2.0);
    sellPrices[work++] = intceil(randfloat(1.4, rate) * basePrice) - 1;
    sellPrices[work++] = intceil(rate * basePrice);
    sellPrices[work++] = intceil(randfloat(1.4, rate) * basePrice) - 1;

    // decreasing phase after the peak
    if (work < 14)
    {
      rate = randfloat(0.9, 0.4);
      for (; work < 14; work++)
      {
        sellPrices[work] = intceil(rate * basePrice);
        rate -= 0.03;
        rate -= randfloat(0, 0.02);
      }
    }
  */

  buy_price = given_prices[0];
  var predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];

  var min_rate = 4000;
  var max_rate = 9000;

  for (var i = 2; i < peak_start; i++) {
    min_pred = Math.floor(min_rate * buy_price / 10000);
    max_pred = Math.ceil(max_rate * buy_price / 10000);


    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
      min_rate = minimum_rate_from_given_and_base(given_prices[i], buy_price);
      max_rate = maximum_rate_from_given_and_base(given_prices[i], buy_price);
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    min_rate -= 500;
    max_rate -= 300;
  }

  // The peak

  for (var i = peak_start; i < peak_start+2; i++) {
    min_pred = Math.floor(0.9 * buy_price);
    max_pred = Math.ceil(1.4 * buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }

  // TODO this could be made more accurate, I've not bothered with forward/backward calculating of the rate each side of the peak value
  for (var i = peak_start+2; i < peak_start+5; i++) {
    if (i == peak_start+3) {
      min_pred = Math.floor(1.4 * buy_price);
      max_pred = Math.ceil(2.0 * buy_price);
    } else {
      min_pred = Math.floor(1.4 * buy_price) - 1;
      max_pred = Math.ceil(2.0 * buy_price) - 1;
    }
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }

  if (peak_start+5 < 14) {
    var min_rate = 4000;
    var max_rate = 9000;

    for (var i = peak_start+5; i < 14; i++) {
      min_pred = Math.floor(min_rate * buy_price / 10000);
      max_pred = Math.ceil(max_rate * buy_price / 10000);


      if (!isNaN(given_prices[i])) {
        if (given_prices[i] < min_pred || given_prices[i] > max_pred ) {
          // Given price is out of predicted range, so this is the wrong pattern
          return;
        }
        min_pred = given_prices[i];
        max_pred = given_prices[i];
        min_rate = minimum_rate_from_given_and_base(given_prices[i], buy_price);
        max_rate = maximum_rate_from_given_and_base(given_prices[i], buy_price);
      }

      predicted_prices.push({
        min: min_pred,
        max: max_pred,
      });

      min_rate -= 500;
      max_rate -= 300;
    }
  }

  yield {
    pattern_description: "decreasing, spike, decreasing",
    pattern_number: 3,
    prices: predicted_prices
  };
}

function* generate_pattern_3(given_prices) {
  for (var peak_start = 2; peak_start < 10; peak_start++) {
    yield* generate_pattern_3_with_peak(given_prices, peak_start);
  }
}


function* generate_possibilities(sell_prices) {
  if (!isNaN(sell_prices[0])) {
    yield* generate_pattern_0(sell_prices);
    yield* generate_pattern_1(sell_prices);
    yield* generate_pattern_2(sell_prices);
    yield* generate_pattern_3(sell_prices);
  } else {
    for (var buy_price = 90; buy_price < 110; buy_price++) {
      sell_prices[0] = sell_prices[1] = buy_price;
      yield* generate_pattern_0(sell_prices);
      yield* generate_pattern_1(sell_prices);
      yield* generate_pattern_2(sell_prices);
      yield* generate_pattern_3(sell_prices);
    }
  }
}

$(document).ready(function () {
  // load sell_prices from local storage
  try {
    const sell_prices = JSON.parse(localStorage.getItem("sell_prices"));

    if (!Array.isArray(sell_prices) || sell_prices.length !== 14) {
      return;
    }

    sell_prices.forEach((sell_price, index) => {
      if (!sell_price) {
        return;
      }

      if (index === 0) {
        $("#buy").val(sell_price);
        return;
      }

      const element = $("#sell_" + index);

      if (element.length) {
        element.val(sell_price);
      }
    });

    $(document).trigger("input");
  } catch (e) {
    console.error(e);
  }

  $("#reset").on("click", function() {
    $("input").val(null).trigger("input");
  })
});

$(document).on("input", function() {
  // Update output on any input change

  var buy_price = parseInt($("#buy").val());

  var sell_prices = [buy_price, buy_price];
  for (var i = 2; i < 14; i++) {
    sell_prices.push(parseInt($("#sell_" + i).val()));
  }

  localStorage.setItem("sell_prices", JSON.stringify(sell_prices));

  const is_empty = sell_prices.every(sell_price => !sell_price);
  if (is_empty) {
    $("#output").html("");
    return;
  }

  var output_possibilities = "";
  for (let poss of generate_possibilities(sell_prices)) {
    var out_line = "<tr><td>" + poss.pattern_description + "</td>"
    for (let day of [...poss.prices].slice(1)) {
      if (day.min != day.max) {
        out_line += "<td>" + day.min + ".." + day.max + "</td>"
      } else {
        out_line += "<td>" + day.min + "</td>"
      }
    }
    out_line += "</tr>"
    output_possibilities += out_line
  }

  $("#output").html(output_possibilities)
})

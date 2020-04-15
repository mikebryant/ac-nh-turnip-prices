// The reverse-engineered code is not perfectly accurate, especially as it's not
// 32-bit ARM floating point. So, be tolerant of slightly unexpected inputs
const FUDGE_FACTOR = 5;

const PATTERN = {
  FLUCTUATING: 0,
  LARGE_SPIKE: 1,
  DECREASING: 2,
  SMALL_SPIKE: 3,
};

const PATTERN_COUNTS = {
  [PATTERN.FLUCTUATING]: 56,
  [PATTERN.LARGE_SPIKE]: 7,
  [PATTERN.DECREASING]: 1,
  [PATTERN.SMALL_SPIKE]: 8,
};

const PROBABILITY_MATRIX = {
  [PATTERN.FLUCTUATING]: {
    [PATTERN.FLUCTUATING]: 0.20,
    [PATTERN.LARGE_SPIKE]: 0.30,
    [PATTERN.DECREASING]: 0.15,
    [PATTERN.SMALL_SPIKE]: 0.35,
  },
  [PATTERN.LARGE_SPIKE]: {
    [PATTERN.FLUCTUATING]: 0.50,
    [PATTERN.LARGE_SPIKE]: 0.05,
    [PATTERN.DECREASING]: 0.20,
    [PATTERN.SMALL_SPIKE]: 0.25,
  },
  [PATTERN.DECREASING]: {
    [PATTERN.FLUCTUATING]: 0.25,
    [PATTERN.LARGE_SPIKE]: 0.45,
    [PATTERN.DECREASING]: 0.05,
    [PATTERN.SMALL_SPIKE]: 0.25,
  },
  [PATTERN.SMALL_SPIKE]: {
    [PATTERN.FLUCTUATING]: 0.45,
    [PATTERN.LARGE_SPIKE]: 0.25,
    [PATTERN.DECREASING]: 0.15,
    [PATTERN.SMALL_SPIKE]: 0.15,
  },
};

const RATE_MULTIPLIER = 10000;

function intceil(val) {
  return Math.trunc(val + 0.99999);
}

function minimum_rate_from_given_and_base(given_price, buy_price) {
  return RATE_MULTIPLIER * (given_price - 0.99999) / buy_price;
}

function maximum_rate_from_given_and_base(given_price, buy_price) {
  return RATE_MULTIPLIER * (given_price + 0.00001) / buy_price;
}

function get_price(rate, basePrice) {
  return intceil(rate * basePrice / RATE_MULTIPLIER);
}

/*
 * This corresponds to the code:
 *   for (int i = start; i < start + length; i++)
 *   {
 *     sellPrices[work++] =
 *       intceil(randfloat(rate_min / RATE_MULTIPLIER, rate_max / RATE_MULTIPLIER) * basePrice);
 *   }
 *
 * Would modify the predicted_prices array.
 * If the given_prices won't match, returns false, otherwise returns true
 */
function generate_individual_random_price(
  given_prices, predicted_prices, start, length, rate_min, rate_max) {
  rate_min *= RATE_MULTIPLIER;
  rate_max *= RATE_MULTIPLIER;

  const buy_price = given_prices[0];

  for (let i = start; i < start + length; i++) {
    let min_pred = get_price(rate_min, buy_price);
    let max_pred = get_price(rate_max, buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred - FUDGE_FACTOR || given_prices[i] > max_pred + FUDGE_FACTOR) {
        // Given price is out of predicted range, so this is the wrong pattern
        return false;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }
  return true;
}

/*
 * This corresponds to the code:
 *   rate = randfloat(start_rate_min, start_rate_max);
 *   for (int i = start; i < start + length; i++)
 *   {
 *     sellPrices[work++] = intceil(rate * basePrice);
 *     rate -= randfloat(rate_decay_min, rate_decay_max);
 *   }
 *
 * Would modify the predicted_prices array.
 * If the given_prices won't match, returns false, otherwise returns true
 */
function generate_decreasing_random_price(
  given_prices, predicted_prices, start, length, rate_min,
  rate_max, rate_decay_min, rate_decay_max) {
  rate_min *= RATE_MULTIPLIER;
  rate_max *= RATE_MULTIPLIER;
  rate_decay_min *= RATE_MULTIPLIER;
  rate_decay_max *= RATE_MULTIPLIER;

  const buy_price = given_prices[0];

  for (let i = start; i < start + length; i++) {
    let min_pred = get_price(rate_min, buy_price);
    let max_pred = get_price(rate_max, buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred - FUDGE_FACTOR || given_prices[i] > max_pred + FUDGE_FACTOR) {
        // Given price is out of predicted range, so this is the wrong pattern
        return false;
      }
      if (given_prices[i] >= min_pred || given_prices[i] <= max_pred) {
        // The value in the FUDGE_FACTOR range is ignored so the rate range would not be empty.
        const real_rate_min = minimum_rate_from_given_and_base(given_prices[i], buy_price);
        const real_rate_max = maximum_rate_from_given_and_base(given_prices[i], buy_price);
        rate_min = Math.max(rate_min, real_rate_min);
        rate_max = Math.min(rate_max, real_rate_max);
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    rate_min -= rate_decay_max;
    rate_max -= rate_decay_min;
  }
  return true;
}


/*
 * This corresponds to the code:
 *   rate = randfloat(rate_min, rate_max);
 *   sellPrices[work++] = intceil(randfloat(rate_min, rate) * basePrice) - 1;
 *   sellPrices[work++] = intceil(rate * basePrice);
 *   sellPrices[work++] = intceil(randfloat(rate_min, rate) * basePrice) - 1;
 *
 * Would modify the predicted_prices array.
 * If the given_prices won't match, returns false, otherwise returns true
 */
function generate_peak_price(
  given_prices, predicted_prices, start, rate_min, rate_max) {
  rate_min *= RATE_MULTIPLIER;
  rate_max *= RATE_MULTIPLIER;

  const buy_price = given_prices[0];

  // Main spike 1
  min_pred = get_price(rate_min, buy_price) - 1;
  max_pred = get_price(rate_max, buy_price) - 1;
  if (!isNaN(given_prices[start])) {
    if (given_prices[start] < min_pred - FUDGE_FACTOR || given_prices[peak_start + 2] > max_pred + FUDGE_FACTOR) {
      // Given price is out of predicted range, so this is the wrong pattern
      return false;
    }
    min_pred = given_prices[start];
    max_pred = given_prices[start];
  }
  predicted_prices.push({
    min: min_pred,
    max: max_pred,
  });

  // Main spike 2
  min_pred = predicted_prices[start].min;
  max_pred = intceil(2.0 * buy_price);
  if (!isNaN(given_prices[start + 1])) {
    if (given_prices[start + 1] < min_pred - FUDGE_FACTOR || given_prices[start + 1] > max_pred + FUDGE_FACTOR) {
      // Given price is out of predicted range, so this is the wrong pattern
      return false;
    }
    min_pred = given_prices[start + 1];
    max_pred = given_prices[start + 1];
  }
  predicted_prices.push({
    min: min_pred,
    max: max_pred,
  });

  // Main spike 3
  min_pred = intceil(1.4 * buy_price) - 1;
  max_pred = predicted_prices[start + 1].max - 1;
  if (!isNaN(given_prices[start + 2])) {
    if (given_prices[start + 2] < min_pred - FUDGE_FACTOR || given_prices[start + 2] > max_pred + FUDGE_FACTOR) {
      // Given price is out of predicted range, so this is the wrong pattern
      return false;
    }
    min_pred = given_prices[start + 2];
    max_pred = given_prices[start + 2];
  }
  predicted_prices.push({
    min: min_pred,
    max: max_pred,
  });

  return true;
}

function*
  generate_pattern_0_with_lengths(
    given_prices, high_phase_1_len, dec_phase_1_len, high_phase_2_len,
    dec_phase_2_len, high_phase_3_len) {
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

  const buy_price = given_prices[0];
  const predicted_prices = [
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
  if (!generate_individual_random_price(
    given_prices, predicted_prices, 2, high_phase_1_len, 0.9, 1.4)) {
    return;
  }

  // Dec Phase 1
  if (!generate_decreasing_random_price(
    given_prices, predicted_prices, 2 + high_phase_1_len, dec_phase_1_len,
    0.6, 0.8, 0.04, 0.1)) {
    return;
  }

  // High Phase 2
  if (!generate_individual_random_price(given_prices, predicted_prices,
    2 + high_phase_1_len + dec_phase_1_len, high_phase_2_len, 0.9, 1.4)) {
    return;
  }

  // Dec Phase 2
  if (!generate_decreasing_random_price(
    given_prices, predicted_prices,
    2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len,
    dec_phase_2_len, 0.6, 0.8, 0.04, 0.1)) {
    return;
  }

  // High Phase 3
  if (2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len + dec_phase_2_len + high_phase_3_len != 14) {
    throw new Error("Phase lengths don't add up");
  }

  const prev_length = 2 + high_phase_1_len + dec_phase_1_len +
    high_phase_2_len + dec_phase_2_len;
  if (!generate_individual_random_price(
    given_prices, predicted_prices, prev_length, 14 - prev_length, 0.9,
    1.4)) {
    return;
  }

  yield {
    pattern_description: "Fluctuating",
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

  const buy_price = given_prices[0];
  const predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];

  if (!generate_decreasing_random_price(
    given_prices, predicted_prices, 2, peak_start - 2, 0.85, 0.9, 0.03,
    0.05)) {
    return;
  }

  // Now each day is independent of next
  min_randoms = [0.9, 1.4, 2.0, 1.4, 0.9, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4]
  max_randoms = [1.4, 2.0, 6.0, 2.0, 1.4, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9]
  for (let i = peak_start; i < 14; i++) {
    if (!generate_individual_random_price(
      given_prices, predicted_prices, i, 1, min_randoms[i - peak_start],
      max_randoms[i - peak_start])) {
      return;
    }
  }
  yield {
    pattern_description: "Large spike",
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

  const buy_price = given_prices[0];
  const predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];

  if (!generate_decreasing_random_price(
    given_prices, predicted_prices, 2, 14 - 2, 0.85, 0.9, 0.03, 0.05)) {
    return;
  }

  yield {
    pattern_description: "Decreasing",
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

  const buy_price = given_prices[0];
  const predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];
  let probability = 1;

  if (!generate_decreasing_random_price(
    given_prices, predicted_prices, 2, peak_start - 2, 0.4, 0.9, 0.03,
    0.05)) {
    return;
  }

  // The peak
  if (!generate_individual_random_price(
    given_prices, predicted_prices, peak_start, 2, 0.9, 1.4)) {
    return;
  }

  if (!generate_peak_price(
    given_prices, predicted_prices, peak_start + 2, 1.4, 2.0)) {
    return;
  }

  if (peak_start + 5 < 14) {
    if (!generate_decreasing_random_price(
      given_prices, predicted_prices, peak_start + 5,
      14 - (peak_start + 5), 0.4, 0.9, 0.03, 0.05)) {
      return;
    }
  }

  yield {
    pattern_description: "Small spike",
    pattern_number: 3,
    prices: predicted_prices
  };
}

function* generate_pattern_3(given_prices) {
  for (var peak_start = 2; peak_start < 10; peak_start++) {
    yield* generate_pattern_3_with_peak(given_prices, peak_start);
  }
}

function* generate_possibilities(sell_prices, first_buy) {
  if (first_buy || isNaN(sell_prices[0])) {
    for (var buy_price = 90; buy_price <= 110; buy_price++) {
      sell_prices[0] = sell_prices[1] = buy_price;
      if (first_buy) {
        yield* generate_pattern_3(sell_prices);
      } else {
        yield* generate_pattern_0(sell_prices);
        yield* generate_pattern_1(sell_prices);
        yield* generate_pattern_2(sell_prices);
        yield* generate_pattern_3(sell_prices);
      }
    }
  } else {
    yield* generate_pattern_0(sell_prices);
    yield* generate_pattern_1(sell_prices);
    yield* generate_pattern_2(sell_prices);
    yield* generate_pattern_3(sell_prices);
  }
}

function row_probability(possibility, previous_pattern) {
  return PROBABILITY_MATRIX[previous_pattern][possibility.pattern_number] / PATTERN_COUNTS[possibility.pattern_number];
}

function get_probabilities(possibilities, previous_pattern) {
  if (typeof previous_pattern === 'undefined' || Number.isNaN(previous_pattern) || previous_pattern === null || previous_pattern < 0 || previous_pattern > 3) {
    return possibilities
  }

  var max_percent = possibilities.map(function (poss) {
    return row_probability(poss, previous_pattern);
  }).reduce(function (prev, current) {
    return prev + current;
  }, 0);

  return possibilities.map(function (poss) {
    poss.probability = row_probability(poss, previous_pattern) / max_percent;
    return poss;
  });
}

function analyze_possibilities(sell_prices, first_buy, previous_pattern) {
  generated_possibilities = Array.from(generate_possibilities(sell_prices, first_buy));
  generated_possibilities = get_probabilities(generated_possibilities, previous_pattern);

  for (let poss of generated_possibilities) {
    var weekMins = [];
    var weekMaxes = [];
    for (let day of poss.prices.slice(2)) {
      weekMins.push(day.min);
      weekMaxes.push(day.max);
    }
    poss.weekGuaranteedMinimum = Math.max(...weekMins);
    poss.weekMax = Math.max(...weekMaxes);
  }
  category_totals = {}
  for (let i of ["Fluctuating", "Decreasing", "Small spike", "Large spike"]) {
    category_totals[i] = generated_possibilities
      .filter(value => value.pattern_description == i)
      .map(value => value.probability)
      .reduce((previous, current) => previous + current, 0)
    console.log(category_totals[i])
  }

  for (let pos of generated_possibilities) {
    pos.category_total_probability = category_totals[pos.pattern_description]
  }

  generated_possibilities.sort((a, b) => {
    return b.category_total_probability - a.category_total_probability
  });

  global_min_max = [];
  for (var day = 0; day < 14; day++) {
    prices = {
      min: 999,
      max: 0,
    }
    for (let poss of generated_possibilities) {
      if (poss.prices[day].min < prices.min) {
        prices.min = poss.prices[day].min;
      }
      if (poss.prices[day].max > prices.max) {
        prices.max = poss.prices[day].max;
      }
    }
    global_min_max.push(prices);
  }

  generated_possibilities.unshift({
    pattern_description: "All patterns",
    pattern_number: 4,
    prices: global_min_max,
    weekGuaranteedMinimum: Math.min(...generated_possibilities.map(poss => poss.weekGuaranteedMinimum)),
    weekMax: Math.max(...generated_possibilities.map(poss => poss.weekMax)),
  });

  return generated_possibilities;
}

const PATTERN = {
  FLUCTUATING: 0,
  LARGE_SPIKE: 1,
  DECREASING: 2,
  SMALL_SPIKE: 3,
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

function range_length(range) {
  return range[1] - range[0];
}

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

function range_intersect(range1, range2) {
  if (range1[0] > range2[1] || range1[1] < range2[0]) {
    return null;
  }
  return [Math.max(range1[0], range2[0]), Math.min(range1[1], range2[1])];
}

function range_intersect_length(range1, range2) {
  if (range1[0] > range2[1] || range1[1] < range2[0]) {
    return 0;
  }
  return range_length(range_intersect(range1, range2));
}

/*
 * Probability Density Function of rates.
 * Since the PDF is continuous*, we approximate it by a discrete probability function:
 *   the value in range [(x - 0.5), (x + 0.5)) has a uniform probability
 *   prob[x - value_start];
 *
 * Note that we operate all rate on the (* RATE_MULTIPLIER) scale.
 *
 * (*): Well not really since it only takes values that "float" can represent in some form, but the
 * space is too large to compute directly in JS.
 */
class PDF {
  /*
   * Initialize a PDF in range [a, b], a and b can be non-integer.
   * if uniform is true, then initialize the probability to be uniform, else initialize to a
   * all-zero (invalid) PDF.
   */
  constructor(a, b, uniform = true) {
    this.value_start = Math.round(a);
    this.value_end = Math.round(b);
    const range = [a, b];
    const total_length = range_length(range);
    this.prob = Array(this.value_end - this.value_start + 1);
    if (uniform) {
      for (let i = 0; i < this.prob.length; i++) {
        this.prob[i] =
            range_intersect_length(this.range_of(i), range) / total_length;
      }
    }
  }

  range_of(idx) {
    // TODO: consider doing the "exclusive end" properly.
    return [this.value_start + idx - 0.5, this.value_start + idx + 0.5 - 1e-9];
  }

  min_value() {
    return this.value_start - 0.5;
  }

  max_value() {
    return this.value_end + 0.5 - 1e-9;
  }

  normalize() {
    const total_probability = this.prob.reduce((acc, it) => acc + it, 0);
    for (let i = 0; i < this.prob.length; i++) {
      this.prob[i] /= total_probability;
    }
  }

  /*
   * Limit the values to be in the range, and return the probability that the value was in this
   * range.
   */
  range_limit(range) {
    let [start, end] = range;
    start = Math.max(start, this.min_value());
    end = Math.min(end, this.max_value());
    if (start >= end) {
      // Set this to invalid values
      this.value_start = this.value_end = 0;
      this.prob = [];
      return 0;
    }

    let prob = 0;
    const start_idx = Math.round(start) - this.value_start;
    const end_idx = Math.round(end) - this.value_start;
    for (let i = start_idx; i <= end_idx; i++) {
      const bucket_prob = this.prob[i] * range_intersect_length(this.range_of(i), range);
      this.prob[i] = bucket_prob;
      prob += bucket_prob;
    }

    this.prob = this.prob.slice(start_idx, end_idx + 1);
    this.value_start = Math.round(start);
    this.value_end = Math.round(end);
    this.normalize();

    return prob;
  }

  /*
   * Subtract the PDF by a uniform distribution in [rate_decay_min, rate_decay_max]
   *
   * For simplicity, we assume that rate_decay_min and rate_decay_max are both integers.
   */
  decay(rate_decay_min, rate_decay_max) {
    const ret = new PDF(
        this.min_value() - rate_decay_max, this.max_value() - rate_decay_min, false);
    /*
    // O(n^2) naive algorithm for reference, which would be too slow.
    for (let i = this.value_start; i <= this.value_end; i++) {
      const unit_prob = this.prob[i - this.value_start] / (rate_decay_max - rate_decay_min) / 2;
      for (let j = rate_decay_min; j < rate_decay_max; j++) {
        // ([i - 0.5, i + 0.5] uniform) - ([j, j + 1] uniform)
        // -> [i - j - 1.5, i + 0.5 - j] with a triangular PDF
        // -> approximate by
        //    [i - j - 1.5, i - j - 0.5] uniform &
        //    [i - j - 0.5, i - j + 0.5] uniform
        ret.prob[i - j - 1 - ret.value_start] += unit_prob; // Part A
        ret.prob[i - j - ret.value_start] += unit_prob; // Part B
      }
    }
    */
    // Transform to "CDF"
    for (let i = 1; i < this.prob.length; i++) {
      this.prob[i] += this.prob[i - 1];
    }
    // Return this.prob[l - this.value_start] + ... + this.prob[r - 1 - this.value_start];
    // This assume that this.prob is already transformed to "CDF".
    const sum = (l, r) => {
      l -= this.value_start;
      r -= this.value_start;
      if (l < 0) l = 0;
      if (r > this.prob.length) r = this.prob.length;
      if (l >= r) return 0;
      return this.prob[r - 1] - (l == 0 ? 0 : this.prob[l - 1]);
    };

    for (let x = 0; x < ret.prob.length; x++) {
      // i - j - 1 - ret.value_start == x  (Part A)
      // -> i = x + j + 1 + ret.value_start, j in [rate_decay_min, rate_decay_max)
      ret.prob[x] = sum(x + rate_decay_min + 1 + ret.value_start, x + rate_decay_max + 1 + ret.value_start);

      // i - j - ret.value_start == x  (Part B)
      // -> i = x + j + ret.value_start, j in [rate_decay_min, rate_decay_max)
      ret.prob[x] += sum(x + rate_decay_min + ret.value_start, x + rate_decay_max + ret.value_start);
    }
    this.prob = ret.prob;
    this.value_start = ret.value_start;
    this.value_end = ret.value_end;
    this.normalize();
  }
}

class Predictor {

  constructor(prices, first_buy, previous_pattern) {
    // The reverse-engineered code is not perfectly accurate, especially as it's not
    // 32-bit ARM floating point. So, be tolerant of slightly unexpected inputs
    this.fudge_factor = 0;
    this.prices = prices;
    this.first_buy = first_buy;
    this.previous_pattern = previous_pattern;
  }

  intceil(val) {
    return Math.trunc(val + 0.99999);
  }

  minimum_rate_from_given_and_base(given_price, buy_price) {
    return RATE_MULTIPLIER * (given_price - 0.99999) / buy_price;
  }

  maximum_rate_from_given_and_base(given_price, buy_price) {
    return RATE_MULTIPLIER * (given_price + 0.00001) / buy_price;
  }

  rate_range_from_given_and_base(given_price, buy_price) {
    return [
      this.minimum_rate_from_given_and_base(given_price, buy_price),
      this.maximum_rate_from_given_and_base(given_price, buy_price)
    ];
  }

  get_price(rate, basePrice) {
    return this.intceil(rate * basePrice / RATE_MULTIPLIER);
  }

  * multiply_generator_probability(generator, probability) {
    for (const it of generator) {
      yield {...it, probability: it.probability * probability};
    }
  }

  /*
   * This corresponds to the code:
   *   for (int i = start; i < start + length; i++)
   *   {
   *     sellPrices[work++] =
   *       intceil(randfloat(rate_min / RATE_MULTIPLIER, rate_max / RATE_MULTIPLIER) * basePrice);
   *   }
   *
   * Would return the conditional probability given the given_prices, and modify
   * the predicted_prices array.
   * If the given_prices won't match, returns 0.
   */
  generate_individual_random_price(
      given_prices, predicted_prices, start, length, rate_min, rate_max) {
    rate_min *= RATE_MULTIPLIER;
    rate_max *= RATE_MULTIPLIER;

    const buy_price = given_prices[0];
    const rate_range = [rate_min, rate_max];
    let prob = 1;

    for (let i = start; i < start + length; i++) {
      let min_pred = this.get_price(rate_min, buy_price);
      let max_pred = this.get_price(rate_max, buy_price);
      if (!isNaN(given_prices[i])) {
        if (given_prices[i] < min_pred - this.fudge_factor || given_prices[i] > max_pred + this.fudge_factor) {
          // Given price is out of predicted range, so this is the wrong pattern
          return 0;
        }
        // TODO: How to deal with probability when there's fudge factor?
        // Clamp the value to be in range now so the probability won't be totally biased to fudged values.
        const real_rate_range =
          this.rate_range_from_given_and_base(clamp(given_prices[i], min_pred, max_pred), buy_price);
        prob *= range_intersect_length(rate_range, real_rate_range) /
          range_length(rate_range);
        min_pred = given_prices[i];
        max_pred = given_prices[i];
      }

      predicted_prices.push({
        min: min_pred,
        max: max_pred,
      });
    }
    return prob;
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
   * Would return the conditional probability given the given_prices, and modify
   * the predicted_prices array.
   * If the given_prices won't match, returns 0.
   */
  generate_decreasing_random_price(
      given_prices, predicted_prices, start, length, start_rate_min,
      start_rate_max, rate_decay_min, rate_decay_max) {
    start_rate_min *= RATE_MULTIPLIER;
    start_rate_max *= RATE_MULTIPLIER;
    rate_decay_min *= RATE_MULTIPLIER;
    rate_decay_max *= RATE_MULTIPLIER;

    const buy_price = given_prices[0];
    let rate_pdf = new PDF(start_rate_min, start_rate_max);
    let prob = 1;

    for (let i = start; i < start + length; i++) {
      let min_pred = this.get_price(rate_pdf.min_value(), buy_price);
      let max_pred = this.get_price(rate_pdf.max_value(), buy_price);
      if (!isNaN(given_prices[i])) {
        if (given_prices[i] < min_pred - this.fudge_factor || given_prices[i] > max_pred + this.fudge_factor) {
          // Given price is out of predicted range, so this is the wrong pattern
          return 0;
        }
        // TODO: How to deal with probability when there's fudge factor?
        // Clamp the value to be in range now so the probability won't be totally biased to fudged values.
        const real_rate_range =
            this.rate_range_from_given_and_base(clamp(given_prices[i], min_pred, max_pred), buy_price);
        prob *= rate_pdf.range_limit(real_rate_range);
        if (prob == 0) {
          return 0;
        }
        min_pred = given_prices[i];
        max_pred = given_prices[i];
      }

      predicted_prices.push({
        min: min_pred,
        max: max_pred,
      });

      rate_pdf.decay(rate_decay_min, rate_decay_max);
    }
    return prob;
  }


  /*
   * This corresponds to the code:
   *   rate = randfloat(rate_min, rate_max);
   *   sellPrices[work++] = intceil(randfloat(rate_min, rate) * basePrice) - 1;
   *   sellPrices[work++] = intceil(rate * basePrice);
   *   sellPrices[work++] = intceil(randfloat(rate_min, rate) * basePrice) - 1;
   *
   * Would return the conditional probability given the given_prices, and modify
   * the predicted_prices array.
   * If the given_prices won't match, returns 0.
   */
  generate_peak_price(
      given_prices, predicted_prices, start, rate_min, rate_max) {
    rate_min *= RATE_MULTIPLIER;
    rate_max *= RATE_MULTIPLIER;

    const buy_price = given_prices[0];
    let prob = 1;
    let rate_range = [rate_min, rate_max];

    // * Calculate the probability first.
    // Prob(middle_price)
    const middle_price = given_prices[start + 1];
    if (!isNaN(middle_price)) {
      const min_pred = this.get_price(rate_min, buy_price);
      const max_pred = this.get_price(rate_max, buy_price);
      if (middle_price < min_pred - this.fudge_factor || middle_price > max_pred + this.fudge_factor) {
        // Given price is out of predicted range, so this is the wrong pattern
        return 0;
      }
      // TODO: How to deal with probability when there's fudge factor?
      // Clamp the value to be in range now so the probability won't be totally biased to fudged values.
      const real_rate_range =
          this.rate_range_from_given_and_base(clamp(middle_price, min_pred, max_pred), buy_price);
      prob *= range_intersect_length(rate_range, real_rate_range) /
        range_length(rate_range);
      if (prob == 0) {
        return 0;
      }

      rate_range = range_intersect(rate_range, real_rate_range);
    }

    const left_price = given_prices[start];
    const right_price = given_prices[start + 2];
    // Prob(left_price | middle_price), Prob(right_price | middle_price)
    //
    // A = rate_range[0], B = rate_range[1], C = rate_min, X = rate, Y = randfloat(rate_min, rate)
    // rate = randfloat(A, B); sellPrices[work++] = intceil(randfloat(C, rate) * basePrice) - 1;
    //
    // => X->U(A,B), Y->U(C,X), Y-C->U(0,X-C), Y-C->U(0,1)*(X-C), Y-C->U(0,1)*U(A-C,B-C),
    // let Z=Y-C,  Z1=A-C, Z2=B-C, Z->U(0,1)*U(Z1,Z2)
    // Prob(Z<=t) = integral_{x=0}^{1} [min(t/x,Z2)-min(t/x,Z1)]/ (Z2-Z1)
    // let F(t, ZZ) = integral_{x=0}^{1} min(t/x, ZZ)
    //    1. if ZZ < t, then min(t/x, ZZ) = ZZ -> F(t, ZZ) = ZZ
    //    2. if ZZ >= t, then F(t, ZZ) = integral_{x=0}^{t/ZZ} ZZ + integral_{x=t/ZZ}^{1} t/x
    //                                 = t - t log(t/ZZ)
    // Prob(Z<=t) = (F(t, Z2) - F(t, Z1)) / (Z2 - Z1)
    // Prob(Y<=t) = Prob(Z>=t-C)
    for (const price of [left_price, right_price]) {
      if (isNaN(price)) {
        continue;
      }
      const min_pred = this.get_price(rate_min, buy_price) - 1;
      const max_pred = this.get_price(rate_range[1], buy_price) - 1;
      if (price < min_pred - this.fudge_factor || price > max_pred + this.fudge_factor) {
        // Given price is out of predicted range, so this is the wrong pattern
        return 0;
      }
      // TODO: How to deal with probability when there's fudge factor?
      // Clamp the value to be in range now so the probability won't be totally biased to fudged values.
      const rate2_range = this.rate_range_from_given_and_base(clamp(price, min_pred, max_pred)+ 1, buy_price);
      const F = (t, ZZ) => {
        if (t <= 0) {
          return 0;
        }
        return ZZ < t ? ZZ : t - t * (Math.log(t) - Math.log(ZZ));
      };
      const [A, B] = rate_range;
      const C = rate_min;
      const Z1 = A - C;
      const Z2 = B - C;
      const PY = (t) => (F(t - C, Z2) - F(t - C, Z1)) / (Z2 - Z1);
      prob *= PY(rate2_range[1]) - PY(rate2_range[0]);
      if (prob == 0) {
        return 0;
      }
    }

    // * Then generate the real predicted range.
    // We're doing things in different order then how we calculate probability,
    // since forward prediction is more useful here.
    //
    // Main spike 1
    let min_pred = this.get_price(rate_min, buy_price) - 1;
    let max_pred = this.get_price(rate_max, buy_price) - 1;
    if (!isNaN(given_prices[start])) {
      min_pred = given_prices[start];
      max_pred = given_prices[start];
    }
    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    // Main spike 2
    min_pred = predicted_prices[start].min;
    max_pred = this.get_price(rate_max, buy_price);
    if (!isNaN(given_prices[start + 1])) {
      min_pred = given_prices[start + 1];
      max_pred = given_prices[start + 1];
    }
    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    // Main spike 3
    min_pred = this.get_price(rate_min, buy_price) - 1;
    max_pred = predicted_prices[start + 1].max - 1;
    if (!isNaN(given_prices[start + 2])) {
      min_pred = given_prices[start + 2];
      max_pred = given_prices[start + 2];
    }
    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    return prob;
  }

  * generate_pattern_0_with_lengths(
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
    let probability = 1;

    // High Phase 1
    probability *= this.generate_individual_random_price(
        given_prices, predicted_prices, 2, high_phase_1_len, 0.9, 1.4);
    if (probability == 0) {
      return;
    }

    // Dec Phase 1
    probability *= this.generate_decreasing_random_price(
        given_prices, predicted_prices, 2 + high_phase_1_len, dec_phase_1_len,
        0.6, 0.8, 0.04, 0.1);
    if (probability == 0) {
      return;
    }

    // High Phase 2
    probability *= this.generate_individual_random_price(given_prices, predicted_prices,
        2 + high_phase_1_len + dec_phase_1_len, high_phase_2_len, 0.9, 1.4);
    if (probability == 0) {
      return;
    }

    // Dec Phase 2
    probability *= this.generate_decreasing_random_price(
        given_prices, predicted_prices,
        2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len,
        dec_phase_2_len, 0.6, 0.8, 0.04, 0.1);
    if (probability == 0) {
      return;
    }

    // High Phase 3
    if (2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len + dec_phase_2_len + high_phase_3_len != 14) {
      throw new Error("Phase lengths don't add up");
    }

    const prev_length = 2 + high_phase_1_len + dec_phase_1_len +
        high_phase_2_len + dec_phase_2_len;
    probability *= this.generate_individual_random_price(
        given_prices, predicted_prices, prev_length, 14 - prev_length, 0.9, 1.4);
    if (probability == 0) {
      return;
    }

    yield {
      pattern_description: i18next.t("patterns.fluctuating"),
      pattern_number: 0,
      prices: predicted_prices,
      probability,
    };
  }

  * generate_pattern_0(given_prices) {
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
          yield* this.multiply_generator_probability(
            this.generate_pattern_0_with_lengths(given_prices, high_phase_1_len, dec_phase_1_len, 7 - high_phase_1_len - high_phase_3_len, 5 - dec_phase_1_len, high_phase_3_len),
            1 / (4 - 2) / 7 / (7 - high_phase_1_len));
        }
      }
    }
  }

  * generate_pattern_1_with_peak(given_prices, peak_start) {
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
    let probability = 1;

    probability *= this.generate_decreasing_random_price(
        given_prices, predicted_prices, 2, peak_start - 2, 0.85, 0.9, 0.03, 0.05);
    if (probability == 0) {
      return;
    }

    // Now each day is independent of next
    let min_randoms = [0.9, 1.4, 2.0, 1.4, 0.9, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4]
    let max_randoms = [1.4, 2.0, 6.0, 2.0, 1.4, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9]
    for (let i = peak_start; i < 14; i++) {
      probability *= this.generate_individual_random_price(
          given_prices, predicted_prices, i, 1, min_randoms[i - peak_start],
          max_randoms[i - peak_start]);
      if (probability == 0) {
        return;
      }
    }
    yield {
      pattern_description: i18next.t("patterns.large-spike"),
      pattern_number: 1,
      prices: predicted_prices,
      probability,
    };
  }

  * generate_pattern_1(given_prices) {
    for (var peak_start = 3; peak_start < 10; peak_start++) {
      yield* this.multiply_generator_probability(this.generate_pattern_1_with_peak(given_prices, peak_start), 1 / (10 - 3));
    }
  }

  * generate_pattern_2(given_prices) {
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
    let probability = 1;

    probability *= this.generate_decreasing_random_price(
        given_prices, predicted_prices, 2, 14 - 2, 0.85, 0.9, 0.03, 0.05);
    if (probability == 0) {
      return;
    }

    yield {
      pattern_description: i18next.t("patterns.decreasing"),
      pattern_number: 2,
      prices: predicted_prices,
      probability,
    };
  }

  * generate_pattern_3_with_peak(given_prices, peak_start) {

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

    probability *= this.generate_decreasing_random_price(
        given_prices, predicted_prices, 2, peak_start - 2, 0.4, 0.9, 0.03, 0.05);
    if (probability == 0) {
      return;
    }

    // The peak
    probability *= this.generate_individual_random_price(
        given_prices, predicted_prices, peak_start, 2, 0.9, 1.4);
    if (probability == 0) {
      return;
    }

    probability *= this.generate_peak_price(
        given_prices, predicted_prices, peak_start + 2, 1.4, 2.0);
    if (probability == 0) {
      return;
    }

    if (peak_start + 5 < 14) {
      probability *= this.generate_decreasing_random_price(
          given_prices, predicted_prices, peak_start + 5, 14 - (peak_start + 5),
          0.4, 0.9, 0.03, 0.05);
      if (probability == 0) {
        return;
      }
    }

    yield {
      pattern_description: i18next.t("patterns.small-spike"),
      pattern_number: 3,
      prices: predicted_prices,
      probability,
    };
  }

  * generate_pattern_3(given_prices) {
    for (let peak_start = 2; peak_start < 10; peak_start++) {
      yield* this.multiply_generator_probability(this.generate_pattern_3_with_peak(given_prices, peak_start), 1 / (10 - 2));
    }
  }

  get_transition_probability(previous_pattern) {
    if (typeof previous_pattern === 'undefined' || Number.isNaN(previous_pattern) || previous_pattern === null || previous_pattern < 0 || previous_pattern > 3) {
      // Use the steady state probabilities of PROBABILITY_MATRIX if we don't
      // know what the previous pattern was.
      // See https://github.com/mikebryant/ac-nh-turnip-prices/issues/68
      // and https://github.com/mikebryant/ac-nh-turnip-prices/pull/90
      // for more information.
      return [4530/13082, 3236/13082, 1931/13082, 3385/13082];
    }

    return PROBABILITY_MATRIX[previous_pattern];
  }

  * generate_all_patterns(sell_prices, previous_pattern) {
    const generate_pattern_fns = [this.generate_pattern_0, this.generate_pattern_1, this.generate_pattern_2, this.generate_pattern_3];
    const transition_probability = this.get_transition_probability(previous_pattern);

    for (let i = 0; i < 4; i++) {
      yield* this.multiply_generator_probability(generate_pattern_fns[i].bind(this)(sell_prices), transition_probability[i]);
    }
  }

  * generate_possibilities(sell_prices, first_buy, previous_pattern) {
    if (first_buy || isNaN(sell_prices[0])) {
      for (var buy_price = 90; buy_price <= 110; buy_price++) {
        sell_prices[0] = sell_prices[1] = buy_price;
        if (first_buy) {
          yield* this.generate_pattern_3(sell_prices);
        } else {
          // All buy prices are equal probability and we're at the outmost layer,
          // so don't need to multiply_generator_probability here.
          yield* this.generate_all_patterns(sell_prices, previous_pattern)
        }
      }
    } else {
      yield* this.generate_all_patterns(sell_prices, previous_pattern)
    }
  }

  analyze_possibilities() {
    const sell_prices = this.prices;
    const first_buy = this.first_buy;
    const previous_pattern = this.previous_pattern;
    let generated_possibilities = []
    for (let i = 0; i < 6; i++) {
      this.fudge_factor = i;
      generated_possibilities = Array.from(this.generate_possibilities(sell_prices, first_buy, previous_pattern));
      if (generated_possibilities.length > 0) {
        console.log("Generated possibilities using fudge factor %d: ", i, generated_possibilities);
        break;
      }
    }

    const total_probability = generated_possibilities.reduce((acc, it) => acc + it.probability, 0);
    for (const it of generated_possibilities) {
      it.probability /= total_probability;
    }

    for (let poss of generated_possibilities) {
      var weekMins = [];
      var weekMaxes = [];
      for (let day of poss.prices.slice(2)) {
        // Check for a future date by checking for a range of prices
        if(day.min !== day.max){
          weekMins.push(day.min);
          weekMaxes.push(day.max);
        } else {
          // If we find a set price after one or more ranged prices, the user has missed a day. Discard that data and start again.
          weekMins = [];
          weekMaxes = [];
        }
      }
      if (!weekMins.length && !weekMaxes.length) {
        weekMins.push(poss.prices[poss.prices.length -1].min);
        weekMaxes.push(poss.prices[poss.prices.length -1].max);
      }
      poss.weekGuaranteedMinimum = Math.max(...weekMins);
      poss.weekMax = Math.max(...weekMaxes);
    }

    let category_totals = {}
    for (let i of [0, 1, 2, 3]) {
      category_totals[i] = generated_possibilities
        .filter(value => value.pattern_number == i)
        .map(value => value.probability)
        .reduce((previous, current) => previous + current, 0);
    }

    for (let pos of generated_possibilities) {
      pos.category_total_probability = category_totals[pos.pattern_number];
    }

    generated_possibilities.sort((a, b) => {
      return b.category_total_probability - a.category_total_probability || b.probability - a.probability;
    });

    let global_min_max = [];
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
      pattern_description: i18next.t("patterns.all"),
      pattern_number: 4,
      prices: global_min_max,
      weekGuaranteedMinimum: Math.min(...generated_possibilities.map(poss => poss.weekGuaranteedMinimum)),
      weekMax: Math.max(...generated_possibilities.map(poss => poss.weekMax))
    });

    return generated_possibilities;
  }
}

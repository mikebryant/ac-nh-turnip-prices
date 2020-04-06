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

  function rangeToGradient({ min, max }, {weekMin, weekMax}) {
    const bad_color = '#ffafa9';
    const good_color = '#cef3a3';

    function scale(value) {
      if (value === buy_price) return 50;
      if (value < buy_price) {
        return 50 - (buy_price - value) / (buy_price - weekMin) * 50;
      }
      return 50 + (value - buy_price) / (weekMax - buy_price) * 50;
    }

    // Two scales with buy pct in the middle.
    const buy_pct = scale(buy_price); // always at 50%
    const min_pct = scale(min);
    const max_pct = scale(max);

    if (min_pct > buy_pct) {
      // okay-ish all the way through.
      return `background: linear-gradient(\
        to top, \
        transparent ${good_color} ${min_pct}%, \
        ${good_color} ${max_pct}%, transparent ${max_pct}%, \
        transparent\
      )`;
    } else if (max_pct < buy_pct) {
      // nothing's *great*.
      return `background: linear-gradient(\
        to top, \
        transparent ${min_pct}%, ${bad_color} ${min_pct}%, \
        ${bad_color} ${max_pct}%, transparent ${max_pct}%, \
        transparent\
      )`;
    }

    return `background: linear-gradient(\
      to top, \
      transparent ${min_pct}%, ${bad_color} ${min_pct}%, \
      ${bad_color} ${buy_pct}%, ${good_color} ${buy_pct}%, \
      ${good_color} ${max_pct}%, transparent ${max_pct}%, \
      transparent\
    )`;
  }

  let output_possibilities = "";
  for (let poss of analyze_possibilities(sell_prices)) {
    var out_line = "<tr><td>" + poss.pattern_description + "</td>"
    for (let day of poss.prices.slice(1)) {
      const cell_style = rangeToGradient(day, poss);
      if (day.min !== day.max) {
        out_line += `<td style="${cell_style}">${day.min}..${day.max}</td>`;
      } else {
        out_line += `<td style="${cell_style}" class="one">${day.min}</td>`;
      }
    }
    out_line += `<td class="one">${poss.weekMin}</td><td class="one">${poss.weekMax}</td></tr>`;
    output_possibilities += out_line
  }

  $("#output").html(output_possibilities)
});

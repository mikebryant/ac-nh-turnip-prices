$(document).ready(function () {
  try {
    const previous_pattern = JSON.parse(localStorage.getItem("previous_pattern"));
    $("#previous_pattern").val(previous_pattern);
  } catch (e) {
    console.error(e);
  }
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

  let previous_pattern = $("#previous_pattern").val();
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

  let possibilities = analyze_possibilities(sell_prices, previous_pattern);
  let output_possibilities = "";
  prob_types = new Map();
  for (let poss of possibilities) {
      if (poss.probability !== 100) { // not predicted min/max
          prob_types.set(poss.pattern_description, poss.probability)
      }
  }
  prob_total = 0;
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
      out_line += `<td class="one">${(poss.probability/prob_total)*100}</td></tr>`;
    }
    output_possibilities += out_line
  }

  $("#output").html(output_possibilities)
});

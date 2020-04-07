function get_prices_from_localstorage() {
  const sell_prices = JSON.parse(localStorage.getItem("sell_prices"));

  if (!Array.isArray(sell_prices) || sell_prices.length !== 14) {
    return null;
  }

  return sell_prices;
}

function get_prices_from_hash() {
  const params = new URLSearchParams(window.location.hash.substr(1));
  const sell_prices = params.get("prices").split(".").map((x) => parseInt(x, 10));

  if (!Array.isArray(sell_prices) || sell_prices.length !== 14) {
    return null;
  }

  return sell_prices;
}

$(document).ready(function () {
  try {
    // load sell_prices from URL hash first, then local storage
    const sell_prices = get_prices_from_hash() || get_prices_from_localstorage();

    if (sell_prices == null) {
      return;
    }

    sell_prices.forEach((sell_price, index) => {
      if (!sell_price) {
        return;
      }

      const buyInput = $("#buy");
      if (index === 0) {
        buyInput.focus();
        buyInput.val(sell_price);
        buyInput.blur();
        return;
      }

      const element = $("#sell_" + index);
      if (element.length) {
        element.focus();
        element.val(sell_price);
        element.blur();
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
  const params = {"prices": sell_prices.map((x) => isNaN(x) ? "" : x).join(".")};
  window.location.hash = (new URLSearchParams(params)).toString();

  const is_empty = sell_prices.every(sell_price => !sell_price);
  if (is_empty) {
    $("#output").html("");
    return;
  }

  let output_possibilities = "";
  for (let poss of analyze_possibilities(sell_prices)) {
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
});

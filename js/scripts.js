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

  const sell_prices = extractAndStoreSellPrices();
  const is_empty = sell_prices.every(sell_price => !sell_price);
  const noDataMessage = $('#no-data-message');

  if(is_empty) {
    noDataMessage.show();
  } else {
    noDataMessage.hide();
    const possibilities = analyze_possibilities(sell_prices);
    renderTableUpdate(possibilities);
  }
});

function extractAndStoreSellPrices() {
  var buy_price = parseInt($("#buy").val());

  var sell_prices = [buy_price, buy_price];
  for (var i = 2; i < 14; i++) {
    sell_prices.push(parseInt($("#sell_" + i).val()));
  }

  localStorage.setItem("sell_prices", JSON.stringify(sell_prices));
  return sell_prices;
}

function renderTableUpdate(possibilities) {

  let output_possibilities = "";
  for (let poss of possibilities) {
    var out_line = `<tr${poss.pattern_number === 4 ? ' class="total-row"' : ''}><td> ${poss.pattern_description} </td>`;
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

  $("#table-output").html(output_possibilities)
}

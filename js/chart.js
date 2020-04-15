let chart_instance = null;

Chart.defaults.global.defaultFontFamily = "'Varela Round', sans-serif";

const chart_options = {
  elements: {
    line: {
      backgroundColor: "#DEF2D9",
      backgroundColor: "#DEF2D9",
      cubicInterpolationMode: "monotone",
    },
  },
  maintainAspectRatio: false,
  tooltips: {
    intersect: false,
    mode: "index",
  },
};

function update_chart(input_data, possibilities) {
  var ctx = $("#chart");

  datasets = [
    {
      label: "Input Price",
      data: input_data.slice(1),
      fill: false,
    },
    {
      label: "Minimum",
      data: possibilities[0].prices.slice(1).map(day => day.min),
      fill: false,
    },
    {
      label: "Maximum",
      data: possibilities[0].prices.slice(1).map(day => day.max),
      fill: "-1",
    },
  ];

  if (chart_instance) {
    chart_instance.data.datasets = datasets;
    chart_instance.update();
  } else {
    chart_instance = new Chart(ctx, {
      data: {
        datasets: datasets,
        labels: ["Sunday", "Mon AM", "Mon PM", "Tue AM", "Tue PM", "Wed AM", "Wed PM", "Thu AM", "Thu PM", "Fri AM", "Fri PM", "Sat AM", "Sat PM"],
      },
      options: chart_options,
      type: "line",
    });
  }
}

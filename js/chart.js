let chart_instance = null;

Chart.defaults.global.defaultFontFamily = "'Varela Round', sans-serif";

function chartCol(context) {

  if (context.dataset.order) {
    return "rgba(222, 242, 217, 1)";
  }
  return "rgba(222, 242, 217, 0.5)";
}

function get_chart_options(row_selected) {
  return {
    elements: {
      line: {
        backgroundColor: row_selected ? chartCol : "rgba(222, 242, 217, 1)",
        cubicInterpolationMode: "monotone",
      },
    },
    maintainAspectRatio: false,
    tooltips: {
      intersect: false,
      mode: "index",
    },
  };
};



function update_chart(input_data, possibilities, selected_row) {
  const ctx = $("#chart");
  const datasets = [{
      label: i18next.t("output.chart.input"),
      data: input_data.slice(1),
      fill: false,
    }, {
      label: i18next.t("output.chart.minimum"),
      data: possibilities[0].prices.slice(1).map(day => day.min),
      fill: false,
    }, {
      label: i18next.t("output.chart.maximum"),
      data: possibilities[0].prices.slice(1).map(day => day.max),
      fill: "-1",
    },
  ];

  if (selected_row) {
    datasets.push({
      label: i18next.t("output.row.minimum"),
      data: selected_row.prices.slice(1).map(day => day.min),
      fill: false,
      order: 2
    });
    datasets.push({
      label: i18next.t("output.row.maximum"),
      data: selected_row.prices.slice(1).map(day => day.max),
      fill: "-1",
      order: 1
    });
  }

  const labels = [i18next.t("weekdays.sunday")].concat(...[i18next.t("weekdays.abr.monday"), i18next.t("weekdays.abr.tuesday"), i18next.t("weekdays.abr.wednesday"), i18next.t("weekdays.abr.thursday"), i18next.t("weekdays.abr.friday"), i18next.t("weekdays.abr.saturday")].map(
      day => [i18next.t("times.morning"),
        i18next.t("times.afternoon")].map(
        time => `${day} ${time}`)));

  if (chart_instance) {
    chart_instance.data.datasets = datasets;
    chart_instance.data.labels = labels;
    chart_instance.options = get_chart_options(!!selected_row);
    chart_instance.update();
  } else {
    chart_instance = new Chart(ctx, {
      data: {
        datasets: datasets,
        labels: labels
      },
      options: get_chart_options(!!selected_row),
      type: "line",
    });
  }
}

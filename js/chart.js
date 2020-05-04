let chart_instance = null;

Chart.defaults.global.defaultFontFamily = "'Varela Round', sans-serif";

const chart_options = {
  elements: {
    line: {
      get backgroundColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--chart-fill-color');
      },
      get borderColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--chart-line-color');
      },
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
  let ctx = $("#chart"),
  datasets = [{
      label: i18next.t("output.chart.input"),
      get pointBorderColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--chart-point-color');
      },
      data: input_data.slice(1),
      fill: false,
    }, {
      label: i18next.t("output.chart.minimum"),
      get pointBorderColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--chart-point-color');
      },
      data: possibilities[0].prices.slice(1).map(day => day.min),
      fill: false,
    }, {
      label: i18next.t("output.chart.maximum"),
      get pointBorderColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--chart-point-color');
      },
      data: possibilities[0].prices.slice(1).map(day => day.max),
      fill: "-1",
    },
  ],
  labels = [i18next.t("weekdays.sunday")].concat(...[i18next.t("weekdays.abr.monday"), i18next.t("weekdays.abr.tuesday"), i18next.t("weekdays.abr.wednesday"), i18next.t("weekdays.abr.thursday"), i18next.t("weekdays.abr.friday"), i18next.t("weekdays.abr.saturday")].map(
      day => [i18next.t("times.morning"),
        i18next.t("times.afternoon")].map(
        time => `${day} ${time}`)));

  if (chart_instance) {
    chart_instance.data.datasets = datasets;
    chart_instance.data.labels = labels;
    chart_instance.options = chart_options;
    chart_instance.update();
  } else {
    chart_instance = new Chart(ctx, {
      data: {
        datasets: datasets,
        labels: labels
      },
      options: chart_options,
      type: "line",
    });
  }
}

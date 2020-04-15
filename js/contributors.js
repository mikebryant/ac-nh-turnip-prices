function getContributors() {
  if (window.jQuery) {
    const container = $('#contributors');
    jQuery.ajax('https://api.github.com/repos/mikebryant/ac-nh-turnip-prices/contributors', {})
      .done(function (data) {
        data.forEach((contributor, idx) => {
          container.append(`<a href="${contributor.html_url}">${contributor.login}</a>`);
          if (idx < data.length - 1) {
            container.append(', ');
          }
        });
      });
  }
}

$(document).ready(getContributors);

function getContributors() {
  if (window.jQuery) {
    const container = $('#contributors');
    jQuery.ajax('https://api.github.com/repos/mikebryant/ac-nh-turnip-prices/contributors', {})
      .done(function (data) {
        data.forEach((contributor, idx) => {
          console.debug('DEBUG:', contributor);
          container.append(`<a href="${contributor.url}">${contributor.login}</a>`);
          if (idx < data.length - 1) {
            container.append(', ');
          }
        });
      });
  }
}

$(document).ready(getContributors);

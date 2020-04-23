function getContributors() {
  if (window.jQuery) {
    const container = $('#contributors');
    jQuery.ajax('https://api.github.com/repos/mikebryant/ac-nh-turnip-prices/contributors', {})
      .done(function (data) {
        const contributorList = [];
        data.forEach((contributor, idx) => {
          contributorList.push(`<a href="${contributor.html_url}">${contributor.login}</a>`);
          if (idx < data.length - 1) {
            contributorList.push(', ');
          }
        });
        container.append(contributorList.join(''));
      });
  }
}

$(document).ready(getContributors);

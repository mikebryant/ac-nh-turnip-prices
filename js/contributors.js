function getContributors(page) {
  if (window.jQuery) {
    const container = $('#contributors');
    jQuery.ajax(`https://api.github.com/repos/mikebryant/ac-nh-turnip-prices/contributors?page=${page}&per_page=100`, {})
      .done(function (data) {
        if (data.length === 0) {
          return;
        }

        const contributorList = [];
        data.forEach((contributor, idx) => {
          if (idx === 0 && page > 1) {
            contributorList.push(', ');
          }

          contributorList.push(`<a href="${contributor.html_url}">${contributor.login}</a>`);
          if (idx < data.length - 1) {
            contributorList.push(', ');
          }
        });
        container.append(contributorList.join(''));
        getContributors(page + 1);
      });
  }
}

$(document).ready(getContributors(1));

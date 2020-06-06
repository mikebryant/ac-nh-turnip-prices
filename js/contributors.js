function getContributors(page) {
  const PER_PAGE = 100
  if (window.jQuery) {
    const container = $('#contributors');
    jQuery.ajax(`https://api.github.com/repos/mikebryant/ac-nh-turnip-prices/contributors?page=${page}&per_page=${PER_PAGE}`, {})
      .done(function (data) {
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
        // If the length of the data is < PER_PAGE, we know we are processing the last page of data.
        if (data.length < PER_PAGE) return; 
        getContributors(page + 1);
      });
  }
}

$(document).ready(getContributors(1));

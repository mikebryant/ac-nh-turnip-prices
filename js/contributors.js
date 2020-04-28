function getContributors() {
  if (window.jQuery) {
    const container = $('#contributors');
    jQuery.ajax('/contributors.json', {})
      .done(function (data) {
        const contributorList = [];
        data.forEach((contributor, idx) => {
          contributorList.push(`<a href="${contributor[1]}">${contributor[0]}</a>`);
          if (idx < data.length - 1) {
            contributorList.push(', ');
          }
        });
        container.append(contributorList.join(''));
      });
  }
}

$(document).ready(getContributors);

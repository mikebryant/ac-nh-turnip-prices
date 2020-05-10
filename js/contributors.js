function getContributors() {
  if (window.jQuery) {
    const container = $('#contributors');
    recursivelyGetContributors("https://api.github.com/repos/mikebryant/ac-nh-turnip-prices/contributors?page=1", container)
  }
}
function recursivelyGetContributors(githublink, container){
  jQuery.ajax(githublink, {})
  .done(function (data, _status, xhr) {
    // console.log(res)
    const link =parseLinkHeader(xhr.getResponseHeader("link"))
    const contributorList = [];
    data.forEach((contributor, idx) => {
      contributorList.push(`<a href="${contributor.html_url}">${contributor.login}</a>`);
      if (idx < data.length - 1) {
        contributorList.push(', ');
      }
    });
    container.append(contributorList.join(''));
    if(link.next){
      recursivelyGetContributors(link.next, container)
    }
  });
}

$(document).ready(getContributors);
function  parseLinkHeader(link) {
	if (typeof link !== 'string') {
		return {};
	}

	return link.split(', ').reduce(function (result, part) {
		var match = part.match('<(.*?)>; rel="(.*?)"');

		if (match && match.length === 3) {
			result[match[2]] = match[1];
		}

		return result;
  }, {});
}
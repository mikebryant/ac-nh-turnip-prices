function getPermalink() {
	if (window.jQuery) {
		const container = $('#permalink');
		if (permalink != null) {
			container.append(permalink);
		}
	}
}
$(document).ready(getPermalink);

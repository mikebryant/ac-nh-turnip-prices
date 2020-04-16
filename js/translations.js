function updateContent() {
  update();
  $("body").localize();
}

i18next
  .use(i18nextXHRBackend)
  .use(i18nextBrowserLanguageDetector)
  .init({
    fallbackLng: 'en',
    debug: true,
    backend: {
      loadPath: 'locales/{{lng}}.json',
    },
  }, function(err, t) {
    jqueryI18next.init(i18next, $);
    i18next.on('languageChanged', () => {
      updateContent();
    });

    // init set content
    $(document).ready(initialize);
    $(document).on("input", updateContent);
    $('input[type = radio]').on("change", updateContent);
  });

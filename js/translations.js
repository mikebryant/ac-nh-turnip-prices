function updateContent() {
  update();
  $('body').localize();
}
const defaultLanguage = 'en';
i18next
.use(i18nextXHRBackend)
.use(i18nextBrowserLanguageDetector)
.init({
  fallbackLng: defaultLanguage,
  debug: true,
  backend: {
    loadPath: 'locales/{{lng}}.json',
  },
}, (err, t) => {
  const languages = [
    ['ca', 'Català'],
    ['de', 'Deutsch'],
    ['en', 'English'],
    ['es-ES', 'Español'],
    ['fr', 'Français'],
    ['hu', 'magyar'],
    ['it', 'Italiano'],
    ['ja', '日本語'],
    ['ko', '한국어'],
    ['nl', 'Nederlands'],
    ['pt-BR', 'Português'],
    ['ru', 'Русский'],
    ['zh-CN', '简体中文'],
    ['zh-TW', '繁體中文'],
    ['th-TH', 'ไทย'],
    ['pl', 'Polski'],
  ].sort(),
  languageSelector = $('#language');
  languages.map(([code, name]) => {
    languageSelector.append(`<option value="${code}"${code == i18next.language ? ' selected' : ''}>${name}</option>`);
  });
  if (!languageSelector.find('[selected]').length)
    languageSelector.val(defaultLanguage);
  languageSelector.on('change', function () {
    if (this.value == i18next.language)
      return;
    i18next.changeLanguage(this.value);
  });
  jqueryI18next.init(i18next, $);
  i18next.on('languageChanged', lng => {
    if (!languageSelector.find(`[value=${lng}]`).length) {
      i18next.changeLanguage(defaultLanguage);
      return;
    }
    languageSelector.val(lng);
    updateContent();
  });
  // init set content
  $(document).ready(initialize);

  let delayTimer;
  $(document).on('input', function() {
    // adding short delay after input to help mitigate potential lag after keystrokes
    clearTimeout(delayTimer);
    delayTimer = setTimeout(function() {
      updateContent();
    }, 500);
  });

  $('input[type = radio]').on('change', updateContent);
});

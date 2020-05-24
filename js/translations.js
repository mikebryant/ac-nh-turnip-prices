function updateContent() {
  update();
  $('body').localize();
}
const defaultLanguage = 'en';
const LANGUAGES = {
  'ca': 'Català',
  'cs': 'Česky',
  'de': 'Deutsch',
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'gl': 'Galego',
  'hu': 'magyar',
  'id': 'Bahasa Indonesia',
  'it': 'Italiano',
  'ja': '日本語',
  'ko': '한국어',
  'nl': 'Nederlands',
  'pl': 'Polski',
  'pt-BR': 'Português',
  'ru': 'Русский',
  'ua': 'Українська',
  'th': 'ไทย',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文'
};
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
  languageSelector = $('#language');
  for (let [code, name] of Object.entries(LANGUAGES)) {
    languageSelector.append(`<option value="${code}">${name}</option>`);
  }
  for (let code of i18next.languages) {
    if (code in LANGUAGES) {
      languageSelector.val(code);
      break;
    }
  }
  languageSelector.on('change', function () {
    if (this.value == i18next.language)
      return;
    i18next.changeLanguage(this.value);
  });
  jqueryI18next.init(i18next, $);
  i18next.on('languageChanged', lng => {
    updateContent();
  });
  // init set content
  $(document).ready(initialize);

  let delayTimer;
  $(document).on('input', function(event) {
    //prevent radio input from updating content twice per input change
    if(event.target.type === 'radio'){ return }
    // adding short delay after input to help mitigate potential lag after keystrokes
    clearTimeout(delayTimer);
    delayTimer = setTimeout(function() {
      updateContent();
    }, 500);
  });

  $('input[type = radio]').on('change', updateContent);
});

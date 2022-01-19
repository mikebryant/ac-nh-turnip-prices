function updateTheme(theme, highColorContrast = false) {
  if (theme == "auto") {
    theme = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  }
  
  if (highColorContrast) {
    theme = theme + "-high-color-contrast"
  }

  if (theme != "light") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  if (chart_instance && chart_options) {
    chart_instance.options = chart_options;
    chart_instance.update();
  }
}

function setupTheming() {
  const themeSelector = $("#theme");
  const highColorContrastCheckbox = $("#high-color-contrast");
  const supportsAutoTheming = (window.matchMedia && window.matchMedia("(prefers-color-scheme)").matches);
  let preferredTheme = localStorage.getItem("theme");
  let selectorVal = preferredTheme ? preferredTheme :
                    supportsAutoTheming ? "auto" : "light";

  // Build theme option menu.
  if (supportsAutoTheming) {
    themeSelector.append(`<option value="auto">${i18next.t('textbox.theme.auto')}</option>`);
  }
  themeSelector.append(`<option value="light">${i18next.t('textbox.theme.light')}</option>`);
  themeSelector.append(`<option value="dark">${i18next.t('textbox.theme.dark')}</option>`);

  themeSelector.val(selectorVal);
  if (localStorage.getItem("highColorContrast") !== null) {
    highColorContrastCheckbox.prop('checked', true);
  }

  // Listen to system changes in theme
  window.matchMedia("(prefers-color-scheme: dark)").addListener(() => {
    if (preferredTheme && preferredTheme != "auto") { return; }
    updateTheme("auto", highColorContrastCheckbox.is(":checked"));
  });

  // Preference listeners
  themeSelector.on('change', function () {
    preferredTheme = this.value;
    updateTheme(preferredTheme, highColorContrastCheckbox.is(":checked"));

    if ((preferredTheme != "light" && !supportsAutoTheming) ||
        (preferredTheme != "auto" && supportsAutoTheming)) {
      localStorage.setItem("theme", preferredTheme);
    } else {
      localStorage.removeItem("theme");
    }
  });
  
  highColorContrastCheckbox.on('change', function () {
    updateTheme(themeSelector.val(), this.checked);
    
    if (this.checked) {
      localStorage.setItem("highColorContrast", true);
    } else {
      localStorage.removeItem("highColorContrast");
    }
  });
}

$(document).ready(function() {
  i18next.init((err, t) => {
    setupTheming();
  });
});
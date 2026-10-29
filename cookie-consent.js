(() => {
  if (!window.CookieConsent?.run) return;

  window.CookieConsent.run({
    mode: "opt-in",
    autoShow: false,
    revision: 2,
    cookie: {
      name: "eujust_cookie_consent",
      expiresAfterDays: 180,
      sameSite: "Lax",
      secure: window.location.protocol === "https:"
    },
    guiOptions: {
      consentModal: {
        layout: "box inline",
        position: "bottom left",
        equalWeightButtons: true,
        flipButtons: false
      },
      preferencesModal: {
        layout: "box",
        position: "right",
        equalWeightButtons: true,
        flipButtons: false
      }
    },
    categories: {
      necessary: { enabled: true, readOnly: true }
    },
    language: {
      default: "en",
      translations: {
        en: {
          consentModal: {
            title: "Cookie preferences",
            description: 'EU JUST uses a preference cookie for 180 days to remember your choice. No optional analytics or marketing cookies are used. <a href="/privacy/#cookies">Read our privacy policy</a>.',
            acceptAllBtn: "Continue",
            showPreferencesBtn: "Manage preferences"
          },
          preferencesModal: {
            title: "Cookie preferences",
            savePreferencesBtn: "Save preferences",
            closeIconLabel: "Close preferences",
            sections: [
              {
                title: "Your choice",
                description: 'No optional analytics or marketing cookies are used. You can delete the preference cookie in your browser. <a href="/privacy/#cookies">Privacy policy and cookie information</a>.'
              },
              {
                title: "Essential",
                description: "eujust_cookie_consent remembers the preference you save here for 180 days. It supports this control and is not used for analytics or advertising.",
                linkedCategory: "necessary"
              }
            ]
          }
        }
      }
    }
  });
})();

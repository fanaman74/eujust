(() => {
  if (!window.CookieConsent?.run) return;

  window.CookieConsent.run({
    mode: "opt-in",
    revision: 1,
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
      necessary: { enabled: true, readOnly: true },
      analytics: {}
    },
    language: {
      default: "en",
      translations: {
        en: {
          consentModal: {
            title: "Cookie preferences",
            description: "EUJUST uses an essential cookie to remember this choice. Optional analytics are off unless you enable them. No analytics tools are currently active.",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Reject optional",
            showPreferencesBtn: "Manage preferences"
          },
          preferencesModal: {
            title: "Cookie preferences",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Reject optional",
            savePreferencesBtn: "Save preferences",
            closeIconLabel: "Close preferences",
            sections: [
              {
                title: "Your choice",
                description: "Change your choice at any time using Cookie preferences in the footer."
              },
              {
                title: "Essential",
                description: "Stores your consent choice so the preference control can remember it.",
                linkedCategory: "necessary"
              },
              {
                title: "Analytics",
                description: "Optional measurement cookies. No analytics scripts currently run on EUJUST.",
                linkedCategory: "analytics"
              }
            ]
          }
        }
      }
    }
  });
})();

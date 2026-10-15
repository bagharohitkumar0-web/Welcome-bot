// relay.js — runs in the ISOLATED world (has chrome.storage access).
// Its only job is to hand the saved EQ config to inject.js, which runs
// in the MAIN world (page context) and can't talk to chrome.storage directly.

function sendConfigToPage(config) {
  window.dispatchEvent(new CustomEvent('MIC_EQ_CONFIG_UPDATE', { detail: config }));
}

// On load: push whatever config is currently saved.
chrome.storage.local.get(['eqConfig'], (result) => {
  const config = result.eqConfig || { preampDb: 0, filters: [] };
  sendConfigToPage(config);
});

// Live updates: if the popup saves new settings while a call is active,
// push them immediately so inject.js can update the running filter chain.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.eqConfig) {
    sendConfigToPage(changes.eqConfig.newValue || { preampDb: 0, filters: [] });
  }
});

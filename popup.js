const gainSlider = document.getElementById('gain');
const gainValueLabel = document.getElementById('gainValue');
const eqText = document.getElementById('eqText');
const fileInput = document.getElementById('fileInput');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// Parses AutoEq / EQ APO style parametric filter text into a plain object:
// { preampDb: number, filters: [{ type, freq, gain, q }] }
function parseEqText(text) {
  const lines = text.split('\n');
  let preampDb = 0;
  const filters = [];

  const preampRe = /Preamp:\s*(-?\d+(\.\d+)?)\s*dB/i;
  // Example: Filter 1: ON PK Fc 105 Hz Gain -2.5 dB Q 1.41
  const filterRe = /Filter\s*\d*:\s*ON\s+(\w+)\s+Fc\s+(-?\d+(\.\d+)?)\s*Hz\s+Gain\s+(-?\d+(\.\d+)?)\s*dB(?:\s+Q\s+(-?\d+(\.\d+)?))?/i;

  for (const line of lines) {
    const preampMatch = line.match(preampRe);
    if (preampMatch) {
      preampDb = parseFloat(preampMatch[1]);
      continue;
    }
    const filterMatch = line.match(filterRe);
    if (filterMatch) {
      filters.push({
        type: filterMatch[1].toUpperCase(),
        freq: parseFloat(filterMatch[2]),
        gain: parseFloat(filterMatch[4]),
        q: filterMatch[6] ? parseFloat(filterMatch[6]) : 0.71
      });
    }
  }

  return { preampDb, filters };
}

function loadSaved() {
  chrome.storage.local.get(['eqConfig', 'extraBoostDb', 'rawText'], (result) => {
    const extra = result.extraBoostDb || 0;
    gainSlider.value = extra;
    gainValueLabel.textContent = `${extra} dB`;
    if (result.rawText) eqText.value = result.rawText;
  });
}

gainSlider.addEventListener('input', () => {
  gainValueLabel.textContent = `${gainSlider.value} dB`;
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    eqText.value = evt.target.result;
  };
  reader.readAsText(file);
});

saveBtn.addEventListener('click', () => {
  const parsed = parseEqText(eqText.value);
  const extraBoostDb = parseFloat(gainSlider.value) || 0;

  const config = {
    preampDb: parsed.preampDb + extraBoostDb,
    filters: parsed.filters
  };

  chrome.storage.local.set(
    { eqConfig: config, extraBoostDb, rawText: eqText.value },
    () => {
      status.textContent = `Saved: ${parsed.filters.length} filter(s), ${config.preampDb.toFixed(1)} dB total gain. Reload the Discord tab.`;
    }
  );
});

loadSaved();

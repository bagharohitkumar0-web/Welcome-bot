const gainSlider = document.getElementById('gain');
const gainValueLabel = document.getElementById('gainValue');
const eqText = document.getElementById('eqText');
const fileInput = document.getElementById('fileInput');
const fileInput2 = document.getElementById('fileInput2');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// Parses AutoEq / EQ APO style parametric filter text into a plain obj
function parseEqText(text) {
  const lines = text.split('\n');
  let preampDB = 0;
  let filters = [];

  const preampRe = /Preamp:\s*(-?\d+(\.\d+)?)\s*dB/i;
  const filterRe = /Filter\s*\d+:\s*(ON|OFF)\s+PK\s+Fc\s+(\d+)\s+Hz\s+(Gain|Atten)\s*(-?\d+(\.\d+)?)\s*dB\s*Q\s*(\d+(\.\d+)?)/i;

  for (const line of lines) {
    const preampMatch = line.match(preampRe);
    if (preampMatch) {
      preampDB = parseFloat(preampMatch[1]);
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

  return { preampDB, filters };
}

function loadSaved() {
  chrome.storage.local.get(['eqConfig', 'extraBoostDB', 'rawText'], (result) => {
    const extra = result.extraBoostDB || 0;
    gainSlider.value = extra;
    gainValueLabel.textContent = `${extra} dB`;
    if (result.rawText) eqText.value = result.rawText;
  });
}

gainSlider.addEventListener('input', () => {
  gainValueLabel.textContent = `${gainSlider.value} dB`;
});

function setupFileListener(inputElement) {
  inputElement.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const newText = evt.target.result;
      if (eqText.value.trim() !== '') {
        eqText.value += '\n' + newText;
      } else {
        eqText.value = newText;
      }
    };
    reader.readAsText(file);
  });
}

setupFileListener(fileInput);
setupFileListener(fileInput2);

saveBtn.addEventListener('click', () => {
  const parsed = parseEqText(eqText.value);
  const extraBoostDB = parseFloat(gainSlider.value) || 0;

  const config = {
    preamDB: parsed.preampDB + extraBoostDB,
    filters: parsed.filters
  };

  chrome.storage.local.set({
    eqConfig: config,
    extraBoostDB: extraBoostDB,
    rawText: eqText.value
  }, () => {
    status.textContent = `Saved: ${config.filters.length} filters, ${config.preamDB}dB`;
  });
});

loadSaved();
      

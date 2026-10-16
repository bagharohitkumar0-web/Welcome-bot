const gainSlider = document.getElementById('gain');
const gainValueLabel = document.getElementById('gainValue');
const eqText = document.getElementById('eqText');
const fileInput = document.getElementById('fileInput');
const fileInput2 = document.getElementById('fileInput2');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

function parseEqText(text) {
  const lines = text.split('\n');
  let preampDB = 0;
  let filters = [];

  const preampRe = /Preamp:\s*(-?\d+(\.\d+)?)\s*dB/i;
  const filterRe = /Filter\s*\d+:\s*(ON|OFF)\s*PK\s*Fc\s*(\d+)\s*Hz\s*(Gain|Atten)\s*(-?\d+(\.\d+)?)\s*(Q\s*(\d+(\.\d+)?))?/i;

  for (const line of lines) {
    if (line.includes('VSTPlugin')) { continue; }
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
        q: filterMatch[7] ? parseFloat(filterMatch[6]) : 0.71
      });
    }
  }
  return { preampDB, filters };
  }

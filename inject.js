// inject.js — runs in the MAIN world, i.e. the actual page context Discord's
// own code runs in. This lets us override navigator.mediaDevices.getUserMedia
// so that when Discord asks for your microphone, it gets a processed stream
// (gain boost + parametric EQ) instead of the raw one.

(function () {
  const FILTER_TYPE_MAP = {
    PK: 'peaking',
    PEQ: 'peaking',
    LSC: 'lowshelf',
    LS: 'lowshelf',
    HSC: 'highshelf',
    HS: 'highshelf',
    NO: 'notch',
    LP: 'lowpass',
    HP: 'highpass',
    LPQ: 'lowpass',
    HPQ: 'highpass',
    AP: 'allpass'
  };

  let currentConfig = { preampDb: 0, filters: [] };
  let activeChain = null; // holds live nodes so we can update them without restarting the call

  window.addEventListener('MIC_EQ_CONFIG_UPDATE', (e) => {
    currentConfig = e.detail || { preampDb: 0, filters: [] };
    if (activeChain) applyConfigToChain(activeChain, currentConfig);
  });

  function applyConfigToChain(chain, config) {
    const { audioCtx, gainNode, filterNodes, filterChainInput, filterChainOutput } = chain;

    // Update preamp gain
    const gainValue = Math.pow(10, (config.preampDb || 0) / 20);
    gainNode.gain.setTargetAtTime(gainValue, audioCtx.currentTime, 0.01);

    // Rebuild filter chain if the number/type of filters changed
    const needsRebuild = filterNodes.length !== (config.filters || []).length;
    if (needsRebuild) {
      // disconnect old filters
      filterChainInput.disconnect();
      filterNodes.forEach((f) => f.disconnect());
      chain.filterNodes = buildFilters(audioCtx, config.filters || []);
      connectFilterChain(filterChainInput, chain.filterNodes, filterChainOutput);
    } else {
      // just update params in place
      (config.filters || []).forEach((f, i) => {
        const node = filterNodes[i];
        node.type = FILTER_TYPE_MAP[f.type] || 'peaking';
        node.frequency.setTargetAtTime(f.freq, audioCtx.currentTime, 0.01);
        node.gain.setTargetAtTime(f.gain, audioCtx.currentTime, 0.01);
        node.Q.setTargetAtTime(f.q || 0.71, audioCtx.currentTime, 0.01);
      });
    }
  }

  function buildFilters(audioCtx, filters) {
    return filters.map((f) => {
      const node = audioCtx.createBiquadFilter();
      node.type = FILTER_TYPE_MAP[f.type] || 'peaking';
      node.frequency.value = f.freq;
      node.gain.value = f.gain;
      node.Q.value = f.q || 0.71;
      return node;
    });
  }

  function connectFilterChain(input, filterNodes, output) {
    let node = input;
    for (const f of filterNodes) {
      node.connect(f);
      node = f;
    }
    node.connect(output);
  }

  function processStream(originalStream, config) {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(originalStream);
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = Math.pow(10, (config.preampDb || 0) / 20);

    const filterNodes = buildFilters(audioCtx, config.filters || []);
    const destination = audioCtx.createMediaStreamDestination();

    source.connect(gainNode);
    connectFilterChain(gainNode, filterNodes, destination);

    activeChain = {
      audioCtx,
      gainNode,
      filterNodes,
      filterChainInput: gainNode,
      filterChainOutput: destination
    };

    // Keep original video tracks (if any) alongside the processed audio track
    const processedStream = destination.stream;
    originalStream.getVideoTracks().forEach((track) => processedStream.addTrack(track));

    return processedStream;
  }

  const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  navigator.mediaDevices.getUserMedia = async function (constraints) {
    const stream = await originalGetUserMedia(constraints);
    if (constraints && constraints.audio) {
      try {
        return processStream(stream, currentConfig);
      } catch (err) {
        console.error('[Mic EQ Boost] Failed to process stream, falling back to raw mic:', err);
        return stream;
      }
    }
    return stream;
  };

  console.log('[Mic EQ Boost] getUserMedia override active.');
})();

/* ==========================================
   FRAMELIFT.FX — COMPLETE APP.JS
   Video Enhancer • Photo Enhancer • Background Remover
========================================== */

const $ = (id) => document.getElementById(id);

const input = $('videoInput');
const dropzone = $('dropzone');
const emptyState = $('emptyState');
const report = $('report');
const preview = $('preview');
const message = $('systemMessage');

let currentUrl = null;
let currentFile = null;
let enhancedUrl = null;

/* ==========================================
   GENERAL UTILITIES
========================================== */

function say(text) {
  if (message) message.textContent = `“${text}”`;

  const voiceMode = $('voiceMode');

  if (
    voiceMode?.value === 'off' ||
    !('speechSynthesis' in window)
  ) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 1.03;

  window.speechSynthesis.speak(utterance);
}

function sizeLabel(bytes) {
  if (!Number.isFinite(bytes)) return '—';

  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }

  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function durationLabel(seconds) {
  if (!Number.isFinite(seconds)) return '—';

  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;

  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
    : `${m}:${String(r).padStart(2, '0')}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function shareFile(file, fallbackBlob, fallbackName) {
  try {
    if (
      file &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({ files: [file] });
      return true;
    }
  } catch (error) {
    if (error.name === 'AbortError') return false;
  }

  if (fallbackBlob) {
    downloadBlob(fallbackBlob, fallbackName);
    alert('Sharing is unavailable here. Your file was downloaded instead.');
  } else {
    alert('Sharing is not supported on this browser.');
  }

  return false;
}

/* ==========================================
   VIDEO ANALYSIS
========================================== */

function analyze(file) {
  if (!file || !file.type.startsWith('video/')) {
    say('Please choose a supported video file.');
    return;
  }

  currentFile = file;

  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = URL.createObjectURL(file);

  if (preview) {
    preview.src = currentUrl;
    preview.style.filter = 'none';
  }

  emptyState?.classList.add('hidden');
  report?.classList.remove('hidden');

  if ($('fileName')) $('fileName').textContent = file.name;
  if ($('fileType')) $('fileType').textContent = file.type || 'Video file';
  if ($('fileSize')) $('fileSize').textContent = sizeLabel(file.size);
  if ($('resolution')) $('resolution').textContent = 'Reading…';
  if ($('fps')) $('fps').textContent = 'Not detected';
  if ($('duration')) $('duration').textContent = 'Reading…';

  const keep = $('downloadOriginal');

  if (keep) {
    keep.href = currentUrl;
    keep.download = file.name;
    keep.classList.remove('hidden');
  }

  if ($('frameExportMessage')) {
    $('frameExportMessage').textContent =
      'Ready to process frames. Choose settings and export.';
  }

  $('enhancedDownload')?.classList.add('hidden');
  $('outputPanel')?.classList.add('hidden');

  if (!preview) return;

  preview.onloadedmetadata = () => {
    const w = preview.videoWidth;
    const h = preview.videoHeight;

    if ($('resolution')) {
      $('resolution').textContent =
        w && h ? `${w} × ${h}` : 'Unavailable';
    }

    if ($('duration')) {
      $('duration').textContent = durationLabel(preview.duration);
    }

    if ($('fps')) $('fps').textContent = 'Not exposed';

    let score = 50;

    if (w >= 1280 && h >= 720) score += 20;
    if (w >= 1920 && h >= 1080) score += 10;
    if (file.size > 0 && preview.duration > 0) score += 10;
    if (file.type.includes('mp4')) score += 5;

    score = Math.min(score, 95);

    if ($('score')) $('score').textContent = score;
    if ($('scoreBar')) $('scoreBar').style.width = `${score}%`;

    say(
      `Analysis complete. Your video is ${w} by ${h} pixels. The original file is preserved.`
    );
  };

  preview.onerror = () =>
    say('The browser could not read this video format.');
}

input?.addEventListener('change', e => analyze(e.target.files[0]));

['dragenter', 'dragover'].forEach(type => {
  dropzone?.addEventListener(type, e => {
    e.preventDefault();
    dropzone.classList.add('drag');
  });
});

['dragleave', 'drop'].forEach(type => {
  dropzone?.addEventListener(type, e => {
    e.preventDefault();
    dropzone.classList.remove('drag');
  });
});

dropzone?.addEventListener('drop', e => {
  const file = e.dataTransfer.files?.[0];
  if (file) analyze(file);
});

/* ==========================================
   ORIGINAL VIDEO
========================================== */

$('keepOriginal')?.addEventListener('click', () => {
  say('Your original video is unchanged. Use the download link to save a copy.');
  $('downloadOriginal')?.click();
});

/* ==========================================
   VOICE
========================================== */

$('testVoice')?.addEventListener('click', () =>
  say('SYSTEM voice check. Framelift.fx is ready.')
);

$('voiceMode')?.addEventListener('change', e => {
  if (e.target.value === 'off' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  say(
    e.target.value === 'off'
      ? 'Voice announcements are off.'
      : 'SYSTEM voice announcements are on.'
  );
});

/* ==========================================
   INTRO
========================================== */

function closeIntro() {
  $('introOverlay')?.classList.add('done');

  say(
    'Initializing Framelift.fx system. Welcome. Your video workspace is ready.'
  );
}

$('enterApp')?.addEventListener('click', closeIntro);

$('replayIntro')?.addEventListener('click', () => {
  $('introOverlay')?.classList.remove('done');
});

/* ==========================================
   SERVICE WORKER
========================================== */

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

/* ==========================================
   VIDEO PREVIEW ENHANCEMENTS
========================================== */

const enhancementButton = $('applyEnhancements');
const enhancementMessage = $('enhancementMessage');

const enhancementControls = {
  sharpen: $('enhanceSharpen'),
  denoise: $('enhanceDenoise'),
  color: $('enhanceColor'),
  smooth: $('enhanceSmooth'),
  strength: $('enhanceStrength')
};

function selectedFilterString(previewMode = false) {
  const strength = enhancementControls.strength?.value || 'medium';

  const amount =
    strength === 'light' ? 1 :
    strength === 'strong' ? 3 : 2;

  const filters = [];

  if (enhancementControls.sharpen?.checked) {
    filters.push(`contrast(${1 + amount * 0.07})`);
  }

  if (enhancementControls.denoise?.checked) {
    filters.push(
      `blur(${
        strength === 'strong'
          ? '0.45px'
          : strength === 'medium'
          ? '0.25px'
          : '0.1px'
      })`
    );
  }

  if (enhancementControls.color?.checked) {
    filters.push(`saturate(${1 + amount * 0.20})`);
  }

  if (previewMode && enhancementControls.smooth?.checked) {
    filters.push(
      `blur(${strength === 'strong' ? '0.3px' : '0.1px'})`
    );
  }

  return filters.length ? filters.join(' ') : 'none';
}

function updateEnhancementPreview() {
  if (!preview || !preview.videoWidth) {
    if (enhancementMessage) {
      enhancementMessage.textContent = 'Please upload a video first.';
    }
    return false;
  }

  const selected = [];

  if (enhancementControls.sharpen?.checked)
    selected.push('Sharpen/contrast');

  if (enhancementControls.denoise?.checked)
    selected.push('Light smoothing');

  if (enhancementControls.color?.checked)
    selected.push('Color enhancement');

  if (enhancementControls.smooth?.checked)
    selected.push('Smooth motion preview');

  if (!selected.length) {
    preview.style.filter = 'none';

    if (enhancementMessage) {
      enhancementMessage.textContent = 'Select at least one enhancement.';
    }

    return false;
  }

  preview.style.filter = selectedFilterString(true);

  if (enhancementMessage) {
    enhancementMessage.textContent =
      `Preview applied: ${selected.join(', ')} (${enhancementControls.strength?.value || 'medium'} strength).`;
  }

  return true;
}

/* ==========================================
   LOADING SCREEN
========================================== */

async function showEnhancementLoader(processFunction) {
  const loader = $('enhanceLoader');
  const percent = $('loaderPercent');
  const bar = $('loaderBar');
  const status = $('loaderStatus');
  const ring = document.querySelector('.loader-ring');

  if (!loader || !percent || !bar || !status || !ring) {
    return processFunction(() => {});
  }

  function updateProgress(value, text) {
    const progress = Math.max(0, Math.min(100, value));

    percent.textContent = `${progress}%`;
    bar.style.width = `${progress}%`;

    ring.style.background =
      `conic-gradient(#78f0d8 ${progress * 3.6}deg,
      rgba(120,240,216,.1) 0deg)`;

    status.textContent = text;
  }

  loader.classList.remove('hidden');

  try {
    await new Promise(requestAnimationFrame);
    return await processFunction(updateProgress);
  } finally {
    loader.classList.add('hidden');
  }
}

/* ==========================================
   APPLY VIDEO PREVIEW ENHANCEMENTS
========================================== */

enhancementButton?.addEventListener('click', async () => {
  if (!preview?.videoWidth) {
    if (enhancementMessage) {
      enhancementMessage.textContent = 'Please upload a video first.';
    }
    return;
  }

  enhancementButton.disabled = true;

  try {
    await showEnhancementLoader(async progress => {
      progress(15, 'Preparing preview…');
      await new Promise(r => setTimeout(r, 180));

      progress(55, 'Applying visual adjustments…');

      const ok = updateEnhancementPreview();

      await new Promise(r => setTimeout(r, 180));

      if (!ok) return false;

      progress(100, 'Preview complete!');
      return true;
    });
  } catch (err) {
    console.error(err);

    if (enhancementMessage) {
      enhancementMessage.textContent = 'Preview failed. Please try again.';
    }
  } finally {
    enhancementButton.disabled = false;
  }
});

/* ==========================================
   FRAME-BY-FRAME VIDEO EXPORT
========================================== */

const exportButton = $('exportFrames');
const frameMessage = $('frameExportMessage');
const enhancedDownload = $('enhancedDownload');
const outputPanel = $('outputPanel');
const outputPreview = $('outputPreview');

function bestRecorderType() {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];

  return types.find(t =>
    window.MediaRecorder && MediaRecorder.isTypeSupported(t)
  ) || '';
}

function waitEvent(target, eventName, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      target.removeEventListener(eventName, handler);
      target.removeEventListener('error', errorHandler);
    }

    function handler() {
      cleanup();
      resolve();
    }

    function errorHandler() {
      cleanup();
      reject(new Error('Video playback error'));
    }

    target.addEventListener(eventName, handler, { once: true });
    target.addEventListener('error', errorHandler, { once: true });
  });
}

exportButton?.addEventListener('click', async () => {
  if (!currentFile || !preview?.src || !preview.videoWidth) {
    if (frameMessage) {
      frameMessage.textContent = 'Please upload and load a video first.';
    }
    return;
  }

  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    if (frameMessage) {
      frameMessage.textContent =
        'This browser does not support canvas video recording. Try Chrome.';
    }
    return;
  }

  const type = bestRecorderType();

  if (!type) {
    if (frameMessage) {
      frameMessage.textContent =
        'No compatible video recording format was detected.';
    }
    return;
  }

  exportButton.disabled = true;
  enhancedDownload?.classList.add('hidden');

  if (frameMessage) {
    frameMessage.textContent = 'Preparing frame processing…';
  }

  const originalTime = preview.currentTime;
  const originalWasPlaying = !preview.paused;

  const canvas = document.createElement('canvas');
  canvas.width = preview.videoWidth;
  canvas.height = preview.videoHeight;

  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    exportButton.disabled = false;

    if (frameMessage) {
      frameMessage.textContent = 'Could not create processing canvas.';
    }
    return;
  }

  const canvasStream = canvas.captureStream(30);
  let audioStream = null;
  let recorder = null;
  let chunks = [];

  try {
    const captureFn = preview.captureStream || preview.mozCaptureStream;

    if (captureFn) {
      try {
        audioStream = captureFn.call(preview);

        audioStream.getAudioTracks().forEach(track => {
          canvasStream.addTrack(track);
        });
      } catch (e) {
        console.warn('Audio capture unavailable', e);
      }
    }

    recorder = new MediaRecorder(canvasStream, { mimeType: type });

    recorder.ondataavailable = e => {
      if (e.data?.size) chunks.push(e.data);
    };

    const finished = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = e =>
        reject(e.error || new Error('Recorder error'));
    });

    await showEnhancementLoader(async progress => {
      progress(2, 'Preparing output canvas…');

      preview.pause();
      preview.style.filter = 'none';

      if (preview.readyState < 2) {
        await waitEvent(preview, 'loadeddata');
      }

      if (preview.currentTime !== 0) {
        const seekDone = waitEvent(preview, 'seeked').catch(() => {});
        preview.currentTime = 0;
        await seekDone;
      }

      recorder.start(1000);
      progress(5, 'Processing video frames…');

      await preview.play();

      return await new Promise((resolve, reject) => {
        let rafId;
        let lastProgress = -1;

        const draw = () => {
          if (
            preview.ended ||
            preview.currentTime >= preview.duration - 0.02
          ) {
            try {
              ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
            } catch {}

            if (recorder.state !== 'inactive') recorder.stop();
            resolve(true);
            return;
          }

          try {
            ctx.filter = selectedFilterString(false);
            ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
            ctx.filter = 'none';
          } catch (err) {
            if (recorder.state !== 'inactive') recorder.stop();
            reject(err);
            return;
          }

          const pct = Math.min(
            95,
            5 + (preview.currentTime / preview.duration) * 90
          );

          const p = Math.floor(pct);

          if (p !== lastProgress) {
            lastProgress = p;

            progress(
              p,
              `Processing frame at ${preview.currentTime.toFixed(1)}s of ${preview.duration.toFixed(1)}s…`
            );
          }

          rafId = requestAnimationFrame(draw);
        };

        rafId = requestAnimationFrame(draw);

        preview.addEventListener('error', () => {
          cancelAnimationFrame(rafId);

          if (recorder.state !== 'inactive') recorder.stop();

          reject(new Error('Video playback error during processing.'));
        }, { once: true });
      });
    });

    await finished;

    const blob = new Blob(chunks, { type });

    if (!blob.size) throw new Error('Empty output file.');

    if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
    enhancedUrl = URL.createObjectURL(blob);

    if (outputPreview) outputPreview.src = enhancedUrl;
    outputPanel?.classList.remove('hidden');

    if (enhancedDownload) {
      enhancedDownload.href = enhancedUrl;

      const ext = type.includes('mp4') ? 'mp4' : 'webm';

      enhancedDownload.download = `framelift-enhanced.${ext}`;
      enhancedDownload.textContent =
        `Download processed video (${sizeLabel(blob.size)})`;

      enhancedDownload.classList.remove('hidden');
    }

    if (frameMessage) {
      frameMessage.textContent =
        `Export complete. ${sizeLabel(blob.size)} output created. ` +
        `${audioStream?.getAudioTracks().length
          ? 'Audio capture was attempted.'
          : 'Audio may not be included in this browser.'}`;
    }

    say('Frame processing and video export are complete. Your original file remains unchanged.');

  } catch (err) {
    console.error('Frame export failed:', err);

    if (frameMessage) {
      frameMessage.textContent =
        `Export failed: ${err.message || 'Browser processing error'}. Try a shorter video.`;
    }

  } finally {
    try {
      preview.pause();
      preview.currentTime = Math.min(originalTime, preview.duration || 0);
    } catch {}

    if (originalWasPlaying) preview.play().catch(() => {});

    canvasStream.getTracks().forEach(t => t.stop());

    if (audioStream) {
      audioStream.getTracks().forEach(t => t.stop());
    }

    exportButton.disabled = false;
  }
});

/* ==========================================
   PHOTO ENHANCER
========================================== */

(() => {
  const photoInput = $('photoInput');
  const photoDropzone = $('photoDropzone');
  const photoWorkspace = $('photoWorkspace');
  const photoOriginal = $('photoOriginal');
  const photoEnhancedPreview = $('photoEnhancedPreview');

  const photoSharpen = $('photoSharpen');
  const photoDenoise = $('photoDenoise');
  const photoColor = $('photoColor');
  const photoStrength = $('photoStrength');
  const photoScale = $('photoScale');

  const enhancePhoto = $('enhancePhoto');
  const photoMessage = $('photoMessage');
  const photoDownload = $('photoDownload');

  if (!photoInput || !photoOriginal || !photoEnhancedPreview) {
    console.warn('Photo Enhancer elements not found.');
    return;
  }

  let originalImage = null;
  let originalFile = null;
  let enhancedCanvas = null;
  let photoURL = null;

  function photoStatus(text) {
    if (photoMessage) photoMessage.textContent = text;
  }

  function loadPhoto(file) {
    if (!file || !file.type.startsWith('image/')) {
      photoStatus('Please select a valid image.');
      return;
    }

    originalFile = file;

    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = URL.createObjectURL(file);

    const img = new Image();

    img.onload = () => {
      originalImage = img;
      photoOriginal.src = photoURL;

      if (photoEnhancedPreview.tagName === 'IMG') {
        photoEnhancedPreview.src = photoURL;
      }

      if (photoWorkspace) {
        photoWorkspace.hidden = false;
        photoWorkspace.style.display = '';
      }

      if (enhancePhoto) enhancePhoto.disabled = false;

      photoStatus('Photo loaded. Ready to enhance.');
      enhancedCanvas = null;

      if (photoDownload) photoDownload.classList.add('hidden');
    };

    img.onerror = () => photoStatus('Unable to load this image.');
    img.src = photoURL;
  }

  photoInput.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (file) loadPhoto(file);
  });

  if (photoDropzone) {
    photoDropzone.addEventListener('dragover', event => {
      event.preventDefault();
      photoDropzone.classList.add('drag-active');
    });

    photoDropzone.addEventListener('dragleave', () => {
      photoDropzone.classList.remove('drag-active');
    });

    photoDropzone.addEventListener('drop', event => {
      event.preventDefault();
      photoDropzone.classList.remove('drag-active');

      const file = event.dataTransfer.files?.[0];
      if (file) loadPhoto(file);
    });
  }

  function enhanceImage() {
    if (!originalImage) {
      photoStatus('Upload a photo first.');
      return;
    }

    photoStatus('Enhancing photo…');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scale = Math.max(1, Math.min(4, Number(photoScale?.value) || 1));

    canvas.width = Math.round(originalImage.naturalWidth * scale);
    canvas.height = Math.round(originalImage.naturalHeight * scale);

    const strength = photoStrength?.value || 'medium';

    const power =
      strength === 'light' ? 1 :
      strength === 'strong' ? 1.8 : 1.4;

    const contrast = photoSharpen?.checked ? 1 + (0.12 * power) : 1;
    const saturation = photoColor?.checked ? 1 + (0.20 * power) : 1;
    const denoise = photoDenoise?.checked ? 0.15 * power : 0;

    ctx.filter = `contrast(${contrast}) saturate(${saturation})`;

    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    ctx.filter = 'none';

    if (denoise > 0) {
      const temp = document.createElement('canvas');
      temp.width = canvas.width;
      temp.height = canvas.height;

      const tctx = temp.getContext('2d');
      tctx.filter = `blur(${denoise}px)`;
      tctx.drawImage(canvas, 0, 0);
      tctx.filter = 'none';

      ctx.globalAlpha = 0.12 * power;
      ctx.drawImage(temp, 0, 0);
      ctx.globalAlpha = 1;
    }

    enhancedCanvas = canvas;

    if (photoEnhancedPreview.tagName === 'IMG') {
      photoEnhancedPreview.src = canvas.toDataURL('image/jpeg', 0.94);
    } else {
      photoEnhancedPreview.style.backgroundImage =
        `url(${canvas.toDataURL('image/jpeg', 0.94)})`;
    }

    photoStatus(
      `Enhancement complete. ${canvas.width} × ${canvas.height}px output.`
    );

    if (photoDownload) {
      photoDownload.classList.remove('hidden');
      photoDownload.onclick = async e => {
        e.preventDefault();

        canvas.toBlob(blob => {
          if (!blob) {
            photoStatus('Unable to create downloadable image.');
            return;
          }

          downloadBlob(blob, 'framelift-enhanced.jpg');
        }, 'image/jpeg', 0.95);
      };
    }
  }

  enhancePhoto?.addEventListener('click', async () => {
    if (!originalImage) {
      photoStatus('Upload a photo first.');
      return;
    }

    enhancePhoto.disabled = true;

    try {
      await showEnhancementLoader(async progress => {
        progress(20, 'Preparing image…');
        await new Promise(r => setTimeout(r, 150));

        progress(55, 'Applying adjustments…');
        enhanceImage();

        progress(100, 'Photo enhancement complete!');
        return true;
      });
    } catch (error) {
      console.error(error);
      photoStatus('Enhancement failed. Please try again.');
    } finally {
      enhancePhoto.disabled = false;
    }
  });

  // Photo share button: add if not present
  let photoShare = $('photoShare');

  if (!photoShare && photoDownload?.parentElement) {
    photoShare = document.createElement('button');
    photoShare.id = 'photoShare';
    photoShare.type = 'button';
    photoShare.textContent = 'Share Photo';
    photoShare.className = photoDownload.className;
    photoDownload.parentElement.appendChild(photoShare);
  }

  photoShare?.addEventListener('click', async () => {
    if (!enhancedCanvas) {
      photoStatus('Enhance your photo first.');
      return;
    }

    enhancedCanvas.toBlob(async blob => {
      if (!blob) return;

      const file = new File([blob], 'framelift-enhanced.jpg', {
        type: 'image/jpeg'
      });

      await shareFile(file, blob, 'framelift-enhanced.jpg');
    }, 'image/jpeg', 0.95);
  });

})();

/* ==========================================
   BACKGROUND REMOVER — AUTO-INJECTED UI
========================================== */

(() => {
  if ($('backgroundRemover')) return;

  const section = document.createElement('section');
  section.id = 'backgroundRemover';
  section.className = 'photo-tool-section';

  section.innerHTML = `
    <div class="tool-heading">
      <span class="tool-number">03</span>
      <div>
        <h2>Background Remover</h2>
        <p>Remove the background and create a transparent PNG.</p>
      </div>
    </div>

    <div class="bg-remove-card">
      <label class="bg-upload-label" for="bgRemoveInput">
        <span class="bg-upload-icon">＋</span>
        <strong>Upload an image</strong>
        <span>Tap to select a photo</span>
      </label>

      <input id="bgRemoveInput" type="file" accept="image/*" hidden>

      <div id="bgRemoveWorkspace" hidden>
        <div class="bg-preview-grid">
          <div class="bg-preview-card">
            <h3>Original</h3>
            <img id="bgRemoveOriginal" alt="Original photo preview">
          </div>

          <div class="bg-preview-card">
            <h3>Background Removed</h3>
            <div class="transparent-preview">
              <img id="bgRemoveResult" alt="Transparent background result">
            </div>
          </div>
        </div>

        <div class="bg-remove-actions">
          <button id="bgRemoveButton" type="button">
            Remove Background
          </button>

          <a id="bgRemoveDownload" class="hidden" download="framelift-transparent.png">
            Download PNG
          </a>

          <button id="bgRemoveShare" type="button">
            Share PNG
          </button>
        </div>

        <p id="bgRemoveMessage" role="status">
          Select an image to begin.
        </p>
      </div>
    </div>
  `;

  const photoStudio = $('photoStudio');

  if (photoStudio) {
    photoStudio.insertAdjacentElement('afterend', section);
  } else {
    document.body.appendChild(section);
  }

  // Styles for injected section
  const style = document.createElement('style');

  style.textContent = `
    #backgroundRemover {
      margin: 28px 0;
      padding: 22px;
      border: 1px solid rgba(120,240,216,.18);
      border-radius: 22px;
      background: rgba(8,32,38,.78);
      color: #e9fffb;
    }

    #backgroundRemover .tool-heading {
      display:flex;
      align-items:center;
      gap:14px;
      margin-bottom:20px;
    }

    #backgroundRemover .tool-number {
      display:flex;
      align-items:center;
      justify-content:center;
      min-width:42px;
      height:42px;
      border-radius:12px;
      background:rgba(120,240,216,.12);
      color:#78f0d8;
      font-weight:800;
    }

    #backgroundRemover h2 {
      margin:0 0 5px;
    }

    #backgroundRemover p {
      color:#91b8b5;
    }

    .bg-remove-card {
      border:1px solid rgba(120,240,216,.15);
      border-radius:18px;
      padding:18px;
    }

    .bg-upload-label {
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:8px;
      min-height:140px;
      border:2px dashed rgba(120,240,216,.3);
      border-radius:16px;
      cursor:pointer;
      text-align:center;
      padding:20px;
    }

    .bg-upload-label:hover {
      border-color:#78f0d8;
      background:rgba(120,240,216,.04);
    }

    .bg-upload-icon {
      font-size:30px;
      color:#78f0d8;
    }

    .bg-upload-label span:last-child {
      color:#91b8b5;
      font-size:13px;
    }

    .bg-preview-grid {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:14px;
      margin-top:20px;
    }

    .bg-preview-card {
      min-width:0;
      border:1px solid rgba(120,240,216,.15);
      border-radius:14px;
      padding:12px;
      overflow:hidden;
    }

    .bg-preview-card h3 {
      font-size:14px;
      margin:0 0 10px;
    }

    .bg-preview-card img {
      width:100%;
      max-height:360px;
      object-fit:contain;
      border-radius:10px;
      display:block;
    }

    .transparent-preview {
      background-color:#eee;
      background-image:
        linear-gradient(45deg,#ccc 25%,transparent 25%),
        linear-gradient(-45deg,#ccc 25%,transparent 25%),
        linear-gradient(45deg,transparent 75%,#ccc 75%),
        linear-gradient(-45deg,transparent 75%,#ccc 75%);
      background-size:20px 20px;
      background-position:0 0,0 10px,10px -10px,-10px 0;
      border-radius:10px;
      overflow:hidden;
    }

    .bg-remove-actions {
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top:18px;
    }

    .bg-remove-actions button,
    .bg-remove-actions a {
      padding:11px 16px;
      border:1px solid rgba(120,240,216,.25);
      border-radius:12px;
      background:rgba(120,240,216,.08);
      color:#e9fffb;
      text-decoration:none;
      font:inherit;
      cursor:pointer;
    }

    .bg-remove-actions button:hover,
    .bg-remove-actions a:hover {
      background:rgba(120,240,216,.16);
    }

    .bg-remove-actions button:disabled {
      opacity:.5;
      cursor:wait;
    }

    #bgRemoveMessage {
      margin-top:14px;
      font-size:13px;
    }

    @media(max-width:600px) {
      .bg-preview-grid {
        grid-template-columns:1fr;
      }
    }
  `;

  document.head.appendChild(style);

  /* ==========================================
     BACKGROUND REMOVAL ENGINE
  ========================================== */

  const bgInput = $('bgRemoveInput');
  const bgOriginal = $('bgRemoveOriginal');
  const bgResult = $('bgRemoveResult');
  const bgWorkspace = $('bgRemoveWorkspace');
  const bgButton = $('bgRemoveButton');
  const bgDownload = $('bgRemoveDownload');
  const bgShare = $('bgRemoveShare');
  const bgMessage = $('bgRemoveMessage');

  let bgOriginalFile = null;
  let bgResultBlob = null;
  let bgOriginalURL = null;
  let bgResultURL = null;
  let removeBackgroundFunction = null;

  function bgStatus(text) {
    if (bgMessage) bgMessage.textContent = text;
  }

  bgInput?.addEventListener('change', event => {
    const file = event.target.files?.[0];

    if (!file || !file.type.startsWith('image/')) {
      bgStatus('Please select a valid image.');
      return;
    }

    bgOriginalFile = file;
    bgResultBlob = null;

    if (bgOriginalURL) URL.revokeObjectURL(bgOriginalURL);
    if (bgResultURL) URL.revokeObjectURL(bgResultURL);

    bgOriginalURL = URL.createObjectURL(file);
    bgOriginal.src = bgOriginalURL;
    bgResult.removeAttribute('src');

    bgWorkspace.hidden = false;
    bgDownload.classList.add('hidden');

    bgStatus('Image loaded. Ready to remove the background.');
  });

  async function getBackgroundRemoval() {
    if (removeBackgroundFunction) return removeBackgroundFunction;

    bgStatus('Loading background-removal engine…');

    const module = await import(
      'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm'
    );

    removeBackgroundFunction = module.removeBackground;
    return removeBackgroundFunction;
  }

  bgButton?.addEventListener('click', async () => {
    if (!bgOriginalFile) {
      bgStatus('Upload an image first.');
      return;
    }

    bgButton.disabled = true;
    bgDownload.classList.add('hidden');

    try {
      const removeBackground = await getBackgroundRemoval();

      bgStatus('Processing image. The first run may take a while.');

      const resultBlob = await removeBackground(bgOriginalFile, {
        model: 'medium',
        output: {
          format: 'image/png',
          quality: 1
        }
      });

      if (!resultBlob || !resultBlob.size) {
        throw new Error('The removal engine returned an empty image.');
      }

      bgResultBlob = resultBlob;

      if (bgResultURL) URL.revokeObjectURL(bgResultURL);
      bgResultURL = URL.createObjectURL(resultBlob);

      bgResult.src = bgResultURL;

      bgDownload.href = bgResultURL;
      bgDownload.download = 'framelift-transparent.png';
      bgDownload.classList.remove('hidden');

      bgStatus('Background removed successfully. Your PNG is transparent.');

    } catch (error) {
      console.error('Background removal error:', error);

      bgStatus(
        'Background removal failed. Check your internet connection and try again.'
      );

    } finally {
      bgButton.disabled = false;
    }
  });

  bgDownload?.addEventListener('click', () => {
    if (!bgResultBlob) return;

    downloadBlob(bgResultBlob, 'framelift-transparent.png');
  });

  bgShare?.addEventListener('click', async () => {
    if (!bgResultBlob) {
      bgStatus('Remove the background first.');
      return;
    }

    const file = new File(
      [bgResultBlob],
      'framelift-transparent.png',
      { type: 'image/png' }
    );

    await shareFile(file, bgResultBlob, 'framelift-transparent.png');
  });

})();
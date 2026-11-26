const input = document.getElementById('videoInput');
const dropzone = document.getElementById('dropzone');
const emptyState = document.getElementById('emptyState');
const report = document.getElementById('report');
const preview = document.getElementById('preview');
const message = document.getElementById('systemMessage');
let currentUrl = null;

function say(text) {
  message.textContent = `“${text}”`;
  if (document.getElementById('voiceMode').value === 'off' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 1.03;
  window.speechSynthesis.speak(utterance);
}
function sizeLabel(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  const units = ['B','KB','MB','GB']; let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
function durationLabel(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const s = Math.floor(seconds), h = Math.floor(s/3600), m = Math.floor((s%3600)/60), r = s%60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}` : `${m}:${String(r).padStart(2,'0')}`;
}
function analyze(file) {
  if (!file || !file.type.startsWith('video/')) { say('Please choose a supported video file.'); return; }
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = URL.createObjectURL(file);
  preview.src = currentUrl;
  emptyState.classList.add('hidden'); report.classList.remove('hidden');
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileType').textContent = file.type || 'Video file';
  document.getElementById('fileSize').textContent = sizeLabel(file.size);
  document.getElementById('resolution').textContent = 'Reading…';
  document.getElementById('fps').textContent = 'Not detected';
  document.getElementById('duration').textContent = 'Reading…';
  const keep = document.getElementById('downloadOriginal');
  keep.href = currentUrl; keep.download = file.name; keep.classList.remove('hidden');
  preview.onloadedmetadata = () => {
    const w = preview.videoWidth, h = preview.videoHeight;
    document.getElementById('resolution').textContent = w && h ? `${w} × ${h}` : 'Unavailable';
    document.getElementById('duration').textContent = durationLabel(preview.duration);
    // The browser's standard video element does not expose a reliable encoded FPS value.
    document.getElementById('fps').textContent = 'Not exposed';
    // A transparent technical readiness indicator based only on readable metadata.
    let score = 50;
    if (w >= 1280 && h >= 720) score += 20;
    if (w >= 1920 && h >= 1080) score += 10;
    if (file.size > 0 && preview.duration > 0) score += 10;
    if (file.type.includes('mp4')) score += 5;
    score = Math.min(score, 95);
    document.getElementById('score').textContent = score;
    document.getElementById('scoreBar').style.width = `${score}%`;
    say(`Analysis complete. Your video is ${w} by ${h} pixels. The original file is preserved.`);
  };
  preview.onerror = () => say('The browser could not read this video format.');
}
input.addEventListener('change', e => analyze(e.target.files[0]));
['dragenter','dragover'].forEach(type => dropzone.addEventListener(type, e => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave','drop'].forEach(type => dropzone.addEventListener(type, e => { e.preventDefault(); dropzone.classList.remove('drag'); }));
dropzone.addEventListener('drop', e => analyze(e.dataTransfer.files[0]));
document.getElementById('keepOriginal').addEventListener('click', () => {
  say('Your original video is unchanged. Use the download link to save a copy.');
  document.getElementById('downloadOriginal').click();
});
document.getElementById('testVoice').addEventListener('click', () => say('SYSTEM voice check. Framelift.fx is ready.'));
document.getElementById('voiceMode').addEventListener('change', e => {
  if (e.target.value === 'off' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  say(e.target.value === 'off' ? 'Voice announcements are off.' : 'SYSTEM voice announcements are on.');
});
function closeIntro() { document.getElementById('introOverlay').classList.add('done'); say('Initializing Framelift.fx system. Welcome. Your video workspace is ready.'); }
document.getElementById('enterApp').addEventListener('click', closeIntro);
document.getElementById('replayIntro').addEventListener('click', () => {
  document.getElementById('introOverlay').classList.remove('done');
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
}
// FrameLift FX Enhancement Studio
const enhancementButton = document.getElementById("applyEnhancements");
const enhancementMessage = document.getElementById("enhancementMessage");

if (enhancementButton && enhancementMessage) {
  enhancementButton.addEventListener("click", () => {
    const selected = [];

    if (document.getElementById("enhanceSharpen")?.checked)
      selected.push("Sharpen");

    if (document.getElementById("enhanceDenoise")?.checked)
      selected.push("Denoise");

    if (document.getElementById("enhanceColor")?.checked)
      selected.push("Color Enhancement");

    if (document.getElementById("enhanceSmooth")?.checked)
      selected.push("Smooth Motion");

    const strength =
      document.getElementById("enhanceStrength")?.value || "medium";

    if (selected.length === 0) {
      enhancementMessage.textContent =
        "Please select at least one enhancement.";
      return;
    }

    enhancementMessage.textContent =
      "Selected: " + selected.join(", ") +
      " | Strength: " + strength +
      " | Ready for processing.";
  });
}
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
// FrameLift FX Visual Enhancement Preview
const enhancementButton = document.getElementById("applyEnhancements");
const enhancementMessage = document.getElementById("enhancementMessage");

const enhancementControls = {
  sharpen: document.getElementById("enhanceSharpen"),
  denoise: document.getElementById("enhanceDenoise"),
  color: document.getElementById("enhanceColor"),
  smooth: document.getElementById("enhanceSmooth"),
  strength: document.getElementById("enhanceStrength")
};

function updateEnhancementPreview() {
  if (!preview || !preview.src) {
    enhancementMessage.textContent = "Please upload a video first.";
    return;
  }

  const selected = [];
  const filters = [];

  const strength = enhancementControls.strength.value;

  const amount = strength === "light" ? 1 :
                strength === "strong" ? 3 : 2;

  if (enhancementControls.sharpen.checked) {
    selected.push("Sharpen");
    filters.push(`contrast(${1 + amount * 0.04})`);
  }

  if (enhancementControls.denoise.checked) {
    selected.push("Denoise");
    filters.push(`brightness(${1 + amount * 0.01})`);
  }

  if (enhancementControls.color.checked) {
    selected.push("Color");
    filters.push(`saturate(${1 + amount * 0.15})`);
  }

  if (enhancementControls.smooth.checked) {
    selected.push("Smooth Motion");
    filters.push(`blur(${strength === "strong" ? "0.4px" : "0.15px"})`);
  }

  if (selected.length === 0) {
    preview.style.filter = "none";
    enhancementMessage.textContent = "Select at least one enhancement.";
    return;
  }

  preview.style.filter = filters.join(" ");

  enhancementMessage.textContent =
    "Preview adjustments applied: " +
    selected.join(", ") +
    " (" + strength + ").";
}

enhancementButton.addEventListener("click", updateEnhancementPreview);

// ===================================
// FRAMELIFT.FX - ANIME VOICE STUDIO
// ===================================

const animeSelect = document.getElementById("animeSelect");
const characterSelect = document.getElementById("characterSelect");
const voiceLanguage = document.getElementById("voiceLanguage");
const animeVoiceText = document.getElementById("animeVoiceText");
const animeVoicePlay = document.getElementById("animeVoicePlay");
const animeVoiceStop = document.getElementById("animeVoiceStop");
const animeVoiceMessage = document.getElementById("animeVoiceMessage");

const animeCharacters = {
  onepiece: ["Luffy", "Zoro", "Nami", "Robin"],
  aot: ["Levi", "Eren", "Mikasa", "Armin"],
  jujutsu: ["Nanami", "Geto", "Gojo", "Nobara"],
  blackclover: ["Yami", "Nacht", "Asta", "Yuno", "Noelle", "Vanessa", "Charlotte"],
  slime: ["Rimuru"],
  naruto: ["Sasuke", "Naruto", "Hinata", "Tsunade", "Sakura", "Kakashi", "Jiraiya", "Itachi", "Minato", "Kushina", "Iruka"]
};

// Character-inspired voice styles.
// These adjust browser voice pitch and speed only.
const characterStyles = {
  Luffy: { pitch: 1.3, rate: 1.12 },
  Zoro: { pitch: 0.8, rate: 0.95 },
  Nami: { pitch: 1.2, rate: 1.0 },
  Robin: { pitch: 0.85, rate: 0.9 },
  Levi: { pitch: 0.8, rate: 0.95 },
  Eren: { pitch: 1.05, rate: 1.08 },
  Mikasa: { pitch: 0.9, rate: 0.95 },
  Armin: { pitch: 1.15, rate: 1.0 },
  Nanami: { pitch: 0.8, rate: 0.9 },
  Geto: { pitch: 0.85, rate: 0.9 },
  Gojo: { pitch: 1.1, rate: 1.05 },
  Nobara: { pitch: 1.2, rate: 1.05 },
  Yami: { pitch: 0.75, rate: 0.9 },
  Nacht: { pitch: 0.8, rate: 0.9 },
  Asta: { pitch: 1.3, rate: 1.18 },
  Yuno: { pitch: 0.95, rate: 0.95 },
  Noelle: { pitch: 1.2, rate: 1.0 },
  Vanessa: { pitch: 1.05, rate: 0.95 },
  Charlotte: { pitch: 0.9, rate: 0.9 },
  Rimuru: { pitch: 1.1, rate: 1.0 },
  Sasuke: { pitch: 0.8, rate: 0.9 },
  Naruto: { pitch: 1.25, rate: 1.12 },
  Hinata: { pitch: 1.25, rate: 0.9 },
  Tsunade: { pitch: 0.9, rate: 0.95 },
  Sakura: { pitch: 1.15, rate: 1.0 },
  Kakashi: { pitch: 0.85, rate: 0.9 },
  Jiraiya: { pitch: 0.9, rate: 1.0 },
  Itachi: { pitch: 0.75, rate: 0.9 },
  Minato: { pitch: 1.0, rate: 0.95 },
  Kushina: { pitch: 1.25, rate: 1.05 },
  Iruka: { pitch: 1.0, rate: 0.95 }
};

function updateCharacterList() {
  const characters = animeCharacters[animeSelect.value] || [];

  characterSelect.innerHTML = "";

  characters.forEach(character => {
    const option = document.createElement("option");
    option.value = character;
    option.textContent = character;
    characterSelect.appendChild(option);
  });
}

animeSelect.addEventListener("change", updateCharacterList);

// Load the initial character list.
updateCharacterList();

animeVoicePlay.addEventListener("click", () => {
  const text = animeVoiceText.value.trim();

  if (!text) {
    animeVoiceMessage.textContent = "Please enter some text first.";
    return;
  }

  if (!("speechSynthesis" in window)) {
    animeVoiceMessage.textContent =
      "Speech is not supported by this browser.";
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const language = voiceLanguage.value;
  const character = characterSelect.value;

  utterance.lang = language;

  const style = characterStyles[character] || {
    pitch: 1,
    rate: 1
  };

  utterance.pitch = style.pitch;
  utterance.rate = style.rate;

  const voices = window.speechSynthesis.getVoices();

  const matchingVoices = voices.filter(voice =>
    voice.lang.toLowerCase().startsWith(
      language.substring(0, 2).toLowerCase()
    )
  );

  if (matchingVoices.length > 0) {
    utterance.voice = matchingVoices[0];
  }

  utterance.onstart = () => {
    animeVoiceMessage.textContent =
      "Playing " + character + " inspired voice...";
  };

  utterance.onend = () => {
    animeVoiceMessage.textContent = "Voice playback finished.";
  };

  utterance.onerror = () => {
    animeVoiceMessage.textContent =
      "Voice playback failed. Please try again.";
  };

  window.speechSynthesis.speak(utterance);
});

animeVoiceStop.addEventListener("click", () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  animeVoiceMessage.textContent = "Voice stopped.";
});

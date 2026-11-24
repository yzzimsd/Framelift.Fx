
const $ = (id) => document.getElementById(id);

const intro = $("introOverlay");
const enter = $("enterApp");
const replay = $("replayIntro");
const videoInput = $("videoInput");
const preview = $("preview");

function enterJIA() {
  intro.classList.add("hidden");
  $("systemMessage").textContent =
    "JIA is online. Select a video to begin.";
}

enter.addEventListener("click", enterJIA);

replay.addEventListener("click", () => {
  intro.classList.remove("hidden");
});

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

let currentVideoURL = null;

videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  if (!file) return;

  if (currentVideoURL) URL.revokeObjectURL(currentVideoURL);

  currentVideoURL = URL.createObjectURL(file);
  preview.src = currentVideoURL;

  $("emptyState").classList.add("hidden");
  $("report").classList.remove("hidden");

  $("fileName").textContent = file.name;
  $("fileType").textContent = file.type || "Unknown format";
  $("fileSize").textContent = formatSize(file.size);
  $("resolution").textContent = "Analyzing...";
  $("duration").textContent = "Analyzing...";
  $("fps").textContent = "Not detected";

  preview.onloadedmetadata = () => {
    $("resolution").textContent =
      `${preview.videoWidth} × ${preview.videoHeight}`;

    $("duration").textContent =
      formatDuration(preview.duration);

    const ready = preview.videoWidth > 0 &&
      preview.videoHeight > 0 &&
      Number.isFinite(preview.duration);

    const score = ready ? 100 : 0;

    $("score").textContent = score;
    $("scoreBar").style.width = score + "%";

    $("systemMessage").textContent =
      "Video analysis complete. Your original file is preserved.";
  };

  $("downloadOriginal").href = currentVideoURL;
  $("downloadOriginal").download = file.name;
  $("downloadOriginal").classList.remove("hidden");

  $("systemMessage").textContent =
    "SYSTEM: Video selected. Analyzing file properties...";
});

$("keepOriginal").addEventListener("click", () => {
  $("systemMessage").textContent =
    "SYSTEM: Original video preserved. No conversion performed.";
  $("downloadOriginal").click();
});

$("testVoice").addEventListener("click", () => {
  if ($("voiceMode").value === "off") return;

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();

    const message = new SpeechSynthesisUtterance(
      "Welcome to JIA. Your video quality workspace is ready."
    );

    speechSynthesis.speak(message);
  }
});

$("voiceMode").addEventListener("change", (event) => {
  if (event.target.value === "off" && "speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
});

const $ = (id) => document.getElementById(id);
const form = $("honeyForm");
const fieldIds = ["date","streak","duration","platform","room","topic","url","goal","notes","obstacle","insight","next"];
let evidence = [];
let toastTimer;

$("date").value = new Date().toISOString().slice(0,10);
$("year").textContent = new Date().getFullYear();

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}
function values() {
  return Object.fromEntries(fieldIds.map(id => [id, $(id).value]));
}
function completion() {
  const v = values();
  const checks = [v.date, v.streak, v.duration, v.platform, v.room.trim(), v.topic.trim(), v.goal.trim(), v.notes.trim(), v.obstacle.trim(), v.insight.trim(), v.next.trim()];
  const filled = checks.filter(Boolean).length + (evidence.length ? 1 : 0);
  return Math.round(filled / (checks.length + 1) * 100);
}
function updateHarvest() {
  const v = values();
  const filled = fieldIds.filter(id => String(v[id] || "").trim()).length;
  const hasJournal = ["goal","notes","obstacle","insight","next"].some(id => v[id].trim());
  $("level").textContent = filled === 0 ? "Empty" : filled < 6 ? "Fresh Drop" : filled < 10 ? "Golden" : "Full Harvest";
  $("pollen").textContent = `${evidence.length} Units`;
  const p = completion();
  $("progressText").textContent = `${p}%`;
  $("progressBar").style.width = `${p}%`;
  $("saveStatus").textContent = "● Autosave aktif";
}
function saveDraft() {
  try {
    localStorage.setItem("honeylog-draft", JSON.stringify(values()));
    updateHarvest();
    $("saveStatus").textContent = "● Draft tersimpan";
  } catch (e) {
    $("saveStatus").textContent = "● Penyimpanan browser tidak tersedia";
  }
}
function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem("honeylog-draft") || "null");
    if (saved) fieldIds.forEach(id => { if (saved[id] !== undefined) $(id).value = saved[id]; });
  } catch (e) {}
}
function renderEvidence() {
  const list = $("evidenceList");
  list.innerHTML = "";
  if (!evidence.length) {
    list.innerHTML = '<p class="empty">Belum ada bukti visual.</p>';
    updateHarvest();
    return;
  }
  evidence.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "evidence-card";
    const img = document.createElement("img");
    img.src = item.url; img.alt = item.name;
    const name = document.createElement("p"); name.textContent = item.name;
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "remove-image"; remove.textContent = "×";
    remove.setAttribute("aria-label", `Hapus ${item.name}`);
    remove.addEventListener("click", () => {
      evidence.splice(index, 1); renderEvidence(); saveDraft();
    });
    card.append(img, name, remove); list.append(card);
  });
  updateHarvest();
}
$("screenshots").addEventListener("change", event => {
  const files = Array.from(event.target.files || []).filter(f => f.type.startsWith("image/"));
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      evidence.push({name:file.name, url:e.target.result});
      renderEvidence();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = "";
});
fieldIds.forEach(id => $(id).addEventListener("input", saveDraft));
form.addEventListener("submit", event => {
  event.preventDefault();
  saveDraft();
  showToast("HoneyLog berhasil diperbarui!");
  $("level").textContent = completion() >= 80 ? "Full Harvest" : "Golden";
});
$("downloadBtn").addEventListener("click", () => {
  saveDraft();
  showToast("Pilih “Save as PDF” pada dialog cetak.");
  window.print();
});
$("resetBtn").addEventListener("click", () => {
  if (!confirm("Hapus draft dan reset semua isian HoneyLog?")) return;
  form.reset();
  $("date").value = new Date().toISOString().slice(0,10);
  evidence = [];
  localStorage.removeItem("honeylog-draft");
  renderEvidence(); saveDraft(); showToast("Form berhasil direset.");
});
loadDraft();
renderEvidence();
updateHarvest();

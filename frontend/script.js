const API = "https://ai-backend-6lru.onrender.com";

async function enhanceText() {
  document.getElementById("loadingText").style.display = "block";

  const input = document.getElementById("inputText").value;

  const res = await fetch(`${API}/enhance-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: input })
  });

  const data = await res.json();
  document.getElementById("enhancedText").innerText = data.enhanced;

  document.getElementById("loadingText").style.display = "none";
}

async function generateImage() {
  document.getElementById("loadingImage").style.display = "block";

  const prompt = document.getElementById("enhancedText").innerText;

  const res = await fetch(`${API}/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();

  // 🔥 HANDLE ERROR
  if (data.error) {
    alert(data.error);
    document.getElementById("loadingImage").style.display = "none";
    return;
  }

  document.getElementById("generatedImage").src = data.image;

  document.getElementById("loadingImage").style.display = "none";
}


async function analyzeImage() {
  document.getElementById("loadingAnalysis").style.display = "block";

  const imageUrl = document.getElementById("imageUrl").value;

  const res = await fetch(`${API}/analyze-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl })
  });

  const data = await res.json();
  document.getElementById("imageDescription").innerText = data.description;

  document.getElementById("loadingAnalysis").style.display = "none";
}

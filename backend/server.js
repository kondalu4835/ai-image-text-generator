import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;


// 🔹 TEXT ENHANCEMENT (Mistral)
app.post("/enhance-text", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small",
        messages: [
          {
            role: "system",
            content: "Improve this prompt for high-quality image generation."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const enhanced = response.data.choices[0].message.content;
    res.json({ enhanced });

  } catch (error) {
    console.log("MISTRAL ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Text enhancement failed" });
  }
});


// 🔥 IMAGE GENERATION (Hugging Face)
app.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const callHF = async () => {
      return await axios({
        url: "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        data: { inputs: prompt },
        responseType: "arraybuffer",
        validateStatus: () => true
      });
    };

    let response = await callHF();
    let contentType = response.headers["content-type"] || "";

    // 🔁 If model loading → wait and retry
    if (contentType.includes("application/json")) {
      const json = JSON.parse(Buffer.from(response.data).toString("utf-8"));

      console.log("HF RESPONSE:", json);

      if (json.error && json.error.includes("loading")) {
        console.log("⏳ Model loading... retrying in 20s");

        await new Promise(r => setTimeout(r, 20000)); // wait 20 sec
        response = await callHF();
        contentType = response.headers["content-type"] || "";
      } else {
        return res.status(500).json({ error: json.error });
      }
    }

    // ❌ HTML error
    if (contentType.includes("text/html")) {
      return res.status(500).json({
        error: "Hugging Face blocked request (API key/model issue)"
      });
    }

    // ✅ Success
    const base64 = Buffer.from(response.data, "binary").toString("base64");
    const image = `data:image/png;base64,${base64}`;

    res.json({ image });

  } catch (error) {
    console.log("HF ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Image generation failed" });
  }
});



// 🔹 IMAGE ANALYSIS (Mistral)
app.post("/analyze-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small",
        messages: [
          {
            role: "system",
            content: "Describe the image clearly."
          },
          {
            role: "user",
            content: imageUrl
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const description = response.data.choices[0].message.content;
    res.json({ description });

  } catch (error) {
    console.log("ANALYSIS ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Image analysis failed" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

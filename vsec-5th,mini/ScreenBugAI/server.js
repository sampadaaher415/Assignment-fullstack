require("dotenv").config();

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();

const upload = multer({
    dest: "uploads/"
});

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.static("public"));

app.post("/analyze", upload.single("screenshot"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: "Screenshot is required."
            });
        }

        const description = req.body.description;

        const imagePath = path.resolve(req.file.path);
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString("base64");
        const mimeType = req.file.mimetype;

        const response = await client.responses.create({
            model: "gpt-5",
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: `
You are an expert UI/UX debugging assistant.

Analyze the uploaded UI screenshot together with
the developer's bug description.

Create a clear structured bug report.

Include:

1. Problem observed
2. Severity
3. Evidence from screenshot
4. Possible cause
5. What the developer should investigate
6. Suggested fix
7. Confidence level

Do not invent details that cannot be seen.
Clearly say when something is uncertain.

Developer's description:

${description}
`
                        },
                        {
                            type: "input_image",
                            image_url: `data:${mimeType};base64,${base64Image}`
                        }
                    ]
                }
            ]
        });

        const answer = response.output_text;

        fs.unlinkSync(imagePath);

        res.json({
            result: answer
        });

    } catch (error) {
        console.error(error);

        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch {}
        }

        res.status(500).json({
            error: "Failed to analyze the screenshot."
        });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`ScreenBug AI running at http://localhost:${PORT}`);
});
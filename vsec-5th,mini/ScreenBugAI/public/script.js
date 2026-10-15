const screenshotInput = document.getElementById("screenshot");
const descriptionInput = document.getElementById("description");
const analyzeBtn = document.getElementById("analyzeBtn");

const preview = document.getElementById("preview");
const loading = document.getElementById("loading");
const result = document.getElementById("result");


// Show screenshot preview
screenshotInput.addEventListener("change", () => {

    const file = screenshotInput.files[0];

    if (!file) {
        preview.style.display = "none";
        return;
    }

    const imageURL = URL.createObjectURL(file);

    preview.src = imageURL;
    preview.style.display = "block";
});


// Analyze button
analyzeBtn.addEventListener("click", async () => {

    const file = screenshotInput.files[0];
    const description = descriptionInput.value.trim();

    if (!file) {
        alert("Please upload a screenshot.");
        return;
    }

    if (!description) {
        alert("Please describe the problem.");
        return;
    }

    const formData = new FormData();

    formData.append("screenshot", file);
    formData.append("description", description);

    analyzeBtn.disabled = true;

    loading.style.display = "block";
    result.textContent = "";

    try {

        const response = await fetch("/analyze", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        result.textContent = data.result;

    } catch (error) {

        result.textContent = "Error: " + error.message;

    } finally {

        analyzeBtn.disabled = false;
        loading.style.display = "none";
    }
});
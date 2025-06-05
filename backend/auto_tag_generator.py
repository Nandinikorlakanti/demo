from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from keybert import KeyBERT
from sentence_transformers import SentenceTransformer

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Load best transformer model for keyBERT
model = SentenceTransformer("all-MiniLM-L6-v2")
kw_model = KeyBERT(model)

@app.route("/generate-tags", methods=["POST"])
def generate_tags():
    data = request.get_json()
    workspace = data.get("workspace")
    file_name = data.get("file_name")

    if not workspace or not file_name:
        return jsonify({"error": "workspace and file_name are required"}), 400

    # Build file path
    file_path = os.path.join("workspaces", workspace, file_name)
    print(f"[DEBUG] Looking for file at: {file_path}")

    # Check if file exists
    if not os.path.exists(file_path):
        return jsonify({"error": f"File '{file_name}' not found in this workspace."}), 404

    # Read file content
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if not content.strip():
        return jsonify({"error": "The selected file is empty."}), 400

    # Generate tags using KeyBERT
    keywords = kw_model.extract_keywords(
        content,
        keyphrase_ngram_range=(1, 2),
        stop_words="english",
        top_n=10,
        use_maxsum=True,
        diversity=0.7,
    )

    # Only keep keywords
    tags = [kw[0] for kw in keywords]

    return jsonify({"tags": tags})


if __name__ == "__main__":
    app.run(debug=True) 
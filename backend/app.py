from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import faiss
import numpy as np
import os
from dotenv import load_dotenv
import re
from collections import Counter

load_dotenv()

app = Flask(__name__)
CORS(app)

# --------------------------
# Global Models (load once)
# --------------------------
# Embedding model
embedder = SentenceTransformer("all-MiniLM-L6-v2")
embedding_dim = 384

# QA model (DistilBERT for question-answering)
qa_pipeline = pipeline("text2text-generation", model="google/flan-t5-base")

def extract_keywords(text):
    # Convert to lowercase and remove special characters
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Split into words and remove common words
    words = text.split()
    stop_words = {'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'}
    words = [word for word in words if word not in stop_words and len(word) > 2]
    
    # Count word frequencies
    word_freq = Counter(words)
    
    # Get top keywords
    keywords = [word for word, _ in word_freq.most_common(10)]
    return keywords

def generate_tags_from_content(content, filename):
    # Extract keywords from content
    keywords = extract_keywords(content)
    
    # Generate additional context-aware tags
    prompt = f"Generate 5 relevant tags for a file named '{filename}' with the following content. Focus on the main topics and themes. Return only the tags separated by commas:\n\n{content[:500]}"
    
    try:
        result = qa_pipeline(prompt, max_length=100, do_sample=False)[0]["generated_text"].strip()
        ai_tags = [tag.strip() for tag in result.split(',')]
    except:
        ai_tags = []
    
    # Combine keywords and AI-generated tags
    all_tags = list(set(keywords + ai_tags))
    
    # Clean and format tags
    cleaned_tags = []
    for tag in all_tags:
        # Remove special characters and convert to lowercase
        tag = re.sub(r'[^\w\s-]', '', tag.lower())
        # Replace spaces with hyphens
        tag = tag.replace(' ', '-')
        if tag and len(tag) > 2:
            cleaned_tags.append(tag)
    
    # Return top 5 unique tags
    return list(dict.fromkeys(cleaned_tags))[:5]

def answer_with_flan(question, context):
    prompt = (
        f"Context:\n{context}\n\n"
        f"Instructions:\n"
        f"- Use only the context to answer.\n"
        f"- If the answer is not present, say: 'Answer not found.'\n"
        f"- Be short and accurate.\n\n"
        f"Question: {question}\n"
        f"Answer:"
    )
    result = qa_pipeline(prompt, max_length=50, do_sample=False)[0]["generated_text"].strip()

    # Filter hallucination: if result not in context or empty
    if result.lower() not in context.lower():
        return "Answer not found."
    return result


# Store workspace data in memory (you might want to use a database in production)
workspace_data = {}

@app.route('/workspace/update', methods=['POST'])
def update_workspace():
    data = request.get_json()
    workspace_id = data.get("workspace_id")
    files = data.get("files", {})
    
    if not workspace_id or not files:
        return jsonify({"error": "Missing workspace_id or files data"}), 400
    
    workspace_data[workspace_id] = files
    return jsonify({"message": "Workspace updated successfully"})

@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    
    # --------------------------
    # Step 1: Parse inputs
    # --------------------------
    question = data.get("question", "")
    workspace_id = data.get("workspace_id")
    
    if not question or not workspace_id:
        return jsonify({"error": "Missing question or workspace_id"}), 400
    
    if workspace_id not in workspace_data:
        return jsonify({"error": "Workspace not found"}), 404
    
    workspace_files = workspace_data[workspace_id]
    doc_keys = list(workspace_files.keys())
    doc_texts = list(workspace_files.values())
    
    if not doc_texts:
        return jsonify({"error": "No files in workspace"}), 400

    # --------------------------
    # Step 2: Embed workspace pages
    # --------------------------
    doc_embeddings = embedder.encode(doc_texts, convert_to_numpy=True)

    # --------------------------
    # Step 3: FAISS search setup
    # --------------------------
    index = faiss.IndexFlatL2(embedding_dim)
    index.add(doc_embeddings)

    query_embedding = embedder.encode([question], convert_to_numpy=True)
    D, I = index.search(query_embedding, k=1)  # Get top 1 relevant doc

    # --------------------------
    # Step 4: Retrieve top docs
    # --------------------------
    top_doc = doc_texts[I[0][0]]
    top_file = doc_keys[I[0][0]]

    # --------------------------
    # Step 5: Generate Answer (using QA pipeline)
    # --------------------------
    answer = answer_with_flan(question, top_doc)

    return jsonify({
        "question": question,
        "answer": answer,
        "source_file": top_file,
        "context_used": top_doc
    })

@app.route('/generate-tags', methods=['POST'])
def generate_tags():
    data = request.get_json()
    content = data.get('content', '')
    filename = data.get('filename', '')
    
    if not content:
        return jsonify({"error": "No content provided"}), 400
    
    tags = generate_tags_from_content(content, filename)
    return jsonify({"tags": tags})

@app.route('/sync-file-to-disk', methods=['POST'])
def sync_file_to_disk():
    data = request.get_json()
    workspace = data.get('workspace')
    file_name = data.get('file_name')
    content = data.get('content')
    if not workspace or not file_name or content is None:
        return jsonify({'error': 'workspace, file_name, and content are required'}), 400
    dir_path = os.path.join('workspaces', workspace)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, file_name)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    return jsonify({'message': 'File synced to disk', 'file_path': file_path})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 
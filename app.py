from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

NUMBER_OF_SAMPLE_TYPES = 8
NUMBER_OF_SAMPLES_PER_SLOT = 10  # Number of samples to read
SAMPLE_CATEGORIES = [
    "1-kick",
    "2-snare",
    "3-perc",
    "4-fx",
    "5-bass",
    "6-lead",
    "7-arpeggio",
    "8-chord"
]

OPZ_MOUNT_PATH = ""

sample_data = [
    [
        {"path": None} for _ in range(NUMBER_OF_SAMPLES_PER_SLOT)
    ]
    for _ in range(NUMBER_OF_SAMPLE_TYPES)
]

@app.route("/")
def index():
    return render_template("sampleloader.html")

@app.route("/save-opz-dir", methods=["POST"])
def process_directory():
    global OPZ_MOUNT_PATH

    data = request.get_json()
    directory = data.get("directory")

    if not directory or not os.path.exists(directory):
        return jsonify({"success": False, "error": "Invalid directory"})

    # Example: List files in the directory
    files = os.listdir(directory)
    print(f"Files in directory {directory}: {files}")
    OPZ_MOUNT_PATH = directory
    return jsonify({"success": True, "files": files})

@app.route("/read-samples")
def read_opz():
    sample_data = []
    print(f"Reading samples from: {OPZ_MOUNT_PATH}")

    for category in SAMPLE_CATEGORIES:
        category_data = []
        for slot in range(NUMBER_OF_SAMPLES_PER_SLOT):
            slot_name = f"{slot + 1:02d}"  # "01", "02", ..., "10"
            slot_path = os.path.join(OPZ_MOUNT_PATH, "samplepacks", category, slot_name)

            sample_info = {
                "path": None
            }

            if os.path.isdir(slot_path):
                files = [
                    f for f in os.listdir(slot_path)
                    if os.path.isfile(os.path.join(slot_path, f))
                ]
                if files:
                    sample_info["path"] = os.path.join(slot_path, files[0])

            category_data.append(sample_info)
        sample_data.append(category_data)

    return jsonify({
        "sampleData": sample_data,
        "categories": SAMPLE_CATEGORIES
    })

@app.route("/delete-sample", methods=["DELETE"])
def delete_sample():
    data = request.get_json()
    sample_path = data.get("path")

    if not sample_path or not os.path.isfile(sample_path):
        return {"error": "Invalid path"}, 400
    
    # prevent deleting files outside the samplepacks directory, probably not needed but just in case
    if not sample_path.startswith(os.path.join(OPZ_MOUNT_PATH, "samplepacks")):
        return {"error": "Unauthorized path"}, 403

    try:
        os.remove(sample_path)
        return {"status": "deleted"}, 200
    except Exception as e:
        print(f"Error deleting file: {e}")
        return {"error": "Failed to delete file"}, 500

if __name__ == "__main__":
    app.run(debug=True)
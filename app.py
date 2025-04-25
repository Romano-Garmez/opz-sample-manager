from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import werkzeug.utils

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
    "8-chord",
]

OPZ_MOUNT_PATH = ""

sample_data = [
    [{"path": None} for _ in range(NUMBER_OF_SAMPLES_PER_SLOT)]
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

            sample_info = {"path": None}

            if os.path.isdir(slot_path):
                files = [
                    f
                    for f in os.listdir(slot_path)
                    if os.path.isfile(os.path.join(slot_path, f))
                ]
                if files:
                    sample_info["path"] = os.path.join(slot_path, files[0])

            category_data.append(sample_info)
        sample_data.append(category_data)

    return jsonify({"sampleData": sample_data, "categories": SAMPLE_CATEGORIES})


@app.route("/upload-sample", methods=["POST"])
def upload_sample():
    category = request.form.get("category")
    slot = request.form.get("slot")
    file = request.files.get("file")

    if not category or not slot or not file:
        return {"error": "Missing category, slot, or file"}, 400

    # Make sure the directory exists
    target_dir = os.path.join(
        OPZ_MOUNT_PATH, "samplepacks", category, f"{int(slot)+1:02d}"
    )
    os.makedirs(target_dir, exist_ok=True)

    # Clean the filename and write it to disk
    filename = werkzeug.utils.secure_filename(file.filename)
    save_path = os.path.join(target_dir, filename)

    try:
        # Delete any existing sample(s) in this slot
        for existing_file in os.listdir(target_dir):
            existing_path = os.path.join(target_dir, existing_file)
            if os.path.isfile(existing_path):
                os.remove(existing_path)

        file.save(save_path)
        return {"status": "uploaded", "path": save_path}, 200
    except Exception as e:
        print("Upload error:", e)
        return {"error": "File save failed"}, 500


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


@app.route("/move-sample", methods=["POST"])
def move_sample():
    source_path = request.form.get("source_path")
    target_category = request.form.get("target_category")
    target_slot = request.form.get("target_slot")

    if not source_path or not target_category or target_slot is None:
        return {"error": "Missing required fields"}, 400

    if not os.path.isfile(source_path):
        return {"error": "Source file doesn't exist"}, 404

    # Resolve destination path
    filename = os.path.basename(source_path)
    target_dir = os.path.join(OPZ_MOUNT_PATH, "samplepacks", target_category, f"{int(target_slot)+1:02d}")
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, filename)

    try:
        # Check if there's an existing file in the target slot
        existing_files = [
            f for f in os.listdir(target_dir)
            if os.path.isfile(os.path.join(target_dir, f))
        ]

        if existing_files:
            # Assume one sample per folder — just grab the first one
            existing_target = os.path.join(target_dir, existing_files[0])

            # Swap paths if moving between different slots
            if os.path.abspath(source_path) != os.path.abspath(existing_target):
                # Move target sample to source's original folder
                source_dir = os.path.dirname(source_path)
                swapped_target = os.path.join(source_dir, os.path.basename(existing_target))
                os.rename(existing_target, swapped_target)

        # Move new file into target slot (overwriting any remaining copy of itself)
        os.rename(source_path, target_path)

        return {"status": "moved", "path": target_path}, 200

    except Exception as e:
        print("Move error:", e)
        return {"error": "Move failed"}, 500



if __name__ == "__main__":
    app.run(debug=True)

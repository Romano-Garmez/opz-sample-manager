import json
import sys
from flask import Flask, render_template, request, jsonify
import html
from flask_cors import CORS
import os
import werkzeug.utils
import subprocess
import uuid
from config import load_config, save_config, reset_config
from PyQt5.QtWidgets import QFileDialog, QApplication

# setup
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# constants
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
sample_data = [
    [{"path": None} for _ in range(NUMBER_OF_SAMPLES_PER_SLOT)]
    for _ in range(NUMBER_OF_SAMPLE_TYPES)
]

# Create necessary directories
UPLOAD_FOLDER = "uploads"
CONVERTED_FOLDER = "converted"
SYN_CONVERTED_FOLDER = "converted/synth"
DRUM_CONVERTED_FOLDER = "converted/drum"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)
os.makedirs(SYN_CONVERTED_FOLDER, exist_ok=True)
os.makedirs(DRUM_CONVERTED_FOLDER, exist_ok=True)

# config
config = load_config()
OPZ_MOUNT_PATH = config.get("OPZ_MOUNT_PATH", "")   # Global variable to store the OP-Z mount path
FFMPEG_PATH = config.get("FFMPEG_PATH", "ffmpeg")   # Global variable to store the path to ffmpeg.exe for windows users. if there isn't one, default to ffmpeg, as that is what will work for mac / linux(?)

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/sampleconverter")
def sampleconverter():
    return render_template("sampleconverter.html")


@app.route("/samplemanager")
def samplemanager():
    return render_template("samplemanager.html")

@app.route("/configeditor")
def configeditor():
    return render_template("configeditor.html")

@app.route("/utilitysettings")
def utilitysettings():
    return render_template("utilitysettings.html")

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
    config["OPZ_MOUNT_PATH"] = OPZ_MOUNT_PATH
    save_config(config)
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
                    sample_info["filename"] = files[0]
                    sample_info["filesize"] = os.path.getsize(
                        os.path.join(slot_path, files[0])
                    )

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
        return {
            "status": "uploaded",
            "path": html.escape(save_path),
            "filename": html.escape(filename),
            "filesize": os.path.getsize(save_path),
        }, 200

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
    target_dir = os.path.join(
        OPZ_MOUNT_PATH, "samplepacks", target_category, f"{int(target_slot)+1:02d}"
    )
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, filename)

    try:
        # Check if there's an existing file in the target slot
        existing_files = [
            f
            for f in os.listdir(target_dir)
            if os.path.isfile(os.path.join(target_dir, f))
        ]

        if existing_files:
            # Assume one sample per folder — just grab the first one
            existing_target = os.path.join(target_dir, existing_files[0])

            # Swap paths if moving between different slots
            if os.path.abspath(source_path) != os.path.abspath(existing_target):
                # Move target sample to source's original folder
                source_dir = os.path.dirname(source_path)
                swapped_target = os.path.join(
                    source_dir, os.path.basename(existing_target)
                )
                os.rename(existing_target, swapped_target)

        # Move new file into target slot (overwriting any remaining copy of itself)
        os.rename(source_path, target_path)

        from html import escape
        return {"status": "moved", "path": escape(target_path)}, 200

    except Exception as e:
        print("Move error:", e)
        return {"error": "Move failed"}, 500


@app.route("/convert", methods=["POST"])
def convert_sample():
    file = request.files["file"]
    sample_type = request.form["type"]  # "drum" or "synth"

    if file.filename == "":
        return jsonify({"error": "No file uploaded"}), 400

    # Save uploaded file temporarily
    input_path = os.path.join(UPLOAD_FOLDER, str(uuid.uuid4()) + "_" + file.filename)
    file.save(input_path)

    # Set output filename
    output_filename = os.path.splitext(os.path.basename(file.filename))[0] + ".aiff"
    output_path = os.path.join(CONVERTED_FOLDER, sample_type, output_filename)

    # Determine max length
    max_duration = 12 if sample_type == "drum" else 6

    # ffmpeg command
    ffmpeg_cmd = [
        "ffmpeg",
        "-i",
        input_path,
        "-af",
        "loudnorm",  # normalize audio
        "-t",
        str(max_duration),  # trim to correct duration
        "-ac",
        "1",  # force mono
        "-ar",
        "44100",  # sample rate 44.1k
        "-sample_fmt",
        "s16",  # 16-bit samples
        output_path,
    ]

    try:
        subprocess.run(ffmpeg_cmd, check=True)
    except subprocess.CalledProcessError as e:
        print("Subprocess Error:", e)
        return jsonify({"error": "Conversion failed"}), 500
    except Exception as e:
        # while trying to 
        print("Unknown error while running attempting to run the ffmpeg subprocess.")
        if(os.name == "nt"):
            print("We detected you are using windows. We repeatedly found this error ([WinError 2] The system cannot find the file specified) when the path to the ffmpeg exe was set incorrectly, maybe double check that if you are getting that error.")
        print("Error details:",e)
        return jsonify({"error": "Conversion failed"}), 500
    finally:
        # Clean up input file
        if os.path.exists(input_path):
            os.remove(input_path)

    return jsonify({"message": f"Converted to {output_filename} successfully."})

@app.route('/get-opz-mount-path', methods=['GET'])
def get_opz_mount_path():
    return jsonify(OPZ_MOUNT_PATH=OPZ_MOUNT_PATH)

# open the sample converter's converted folder in the file explorer
@app.route("/open-explorer", methods=["POST"])
def open_explorer():
    folder_path = os.path.join(os.path.abspath("."), CONVERTED_FOLDER)
    try:
        if sys.platform.startswith("win"):
            subprocess.Popen(["explorer", folder_path])
        elif sys.platform.startswith("darwin"):
            subprocess.Popen(["open", folder_path])
        else:  # Linux and others
            subprocess.Popen(["xdg-open", folder_path])

        return jsonify({"status": "opened", "path": folder_path}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    

@app.route("/get-user-file-path")
def get_user_file():
    print("here")
    return run_dialog("file")

@app.route("/get-user-folder-path")
def get_user_folder():
    return run_dialog("folder")

@app.route("/get-save-location-path")
def get_save_location():
    return run_dialog("save")

def run_dialog(mode):
    try:
        result = subprocess.run(
            [sys.executable, "dialog_runner.py", mode],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=30
        )
        path = result.stdout.decode().strip()
        if os.path.exists(path) or mode == "save":
            return jsonify({"path": path})
        else:
            return jsonify({"error": "No selection made"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/get-config/general')
def get_general_config():
    general_json_path = os.path.join(OPZ_MOUNT_PATH, 'config', 'general.json')
    with open(general_json_path) as f:
        return jsonify(json.load(f))
    
@app.route('/get-config/midi')
def get_midi_config():
    midi_json_path = os.path.join(OPZ_MOUNT_PATH, 'config', 'midi.json')
    with open(midi_json_path) as f:
        return jsonify(json.load(f))

@app.route('/save-config/general', methods=['POST'])
def save_general_config():
    general_json_path = os.path.join(OPZ_MOUNT_PATH, 'config', 'general.json')
    data = request.get_json()
    with open(general_json_path, 'w') as f:
        json.dump(data, f, indent=4)
    return '', 204

@app.route('/save-config/midi', methods=['POST'])
def save_midi_config():
    midi_json_path = os.path.join(OPZ_MOUNT_PATH, 'config', 'midi.json')
    data = request.get_json()
    with open(midi_json_path, 'w') as f:
        json.dump(data, f, indent=4)
    return '', 204

@app.route('/reset-config', methods=['POST'])
def reset_config_flask():
    global OPZ_MOUNT_PATH
    OPZ_MOUNT_PATH = ""
    reset_config()
    return jsonify({"success": True, "message": "Configuration reset successfully"})

if __name__ == "__main__":
    app.run(debug=False)

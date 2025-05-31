import os
import json

CONFIG_PATH = "opz_sm_config.json"

# Function to load the configuration from a JSON file
def load_config():
    if not os.path.exists(CONFIG_PATH):
        return {}  # return empty config if file doesn't exist
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

# Function to save the configuration to a JSON file
def save_config(config_dict):
    with open(CONFIG_PATH, "w") as f:
        json.dump(config_dict, f, indent=4)

def reset_config():
    if os.path.exists(CONFIG_PATH):
        print(f"Resetting configuration by clearing {CONFIG_PATH}")
        with open(CONFIG_PATH, "w") as f:
            json.dump({}, f, indent=4)
    else:
        print("Config file does not exist, creating empty config.")
        with open(CONFIG_PATH, "w") as f:
            json.dump({}, f, indent=4)
    print("Configuration reset successfully.")
    return {}  # return empty config after reset
import os
import json

import logging

CONFIG_PATH = "opz_sm_config.json"
config = None

# set the flask logger level
def set_logger_level(level_name: str):
    level_name = level_name.upper()
    level = getattr(logging, level_name, None)
    if not isinstance(level, int):
        raise ValueError(f"Invalid log level: {level_name}")

    from app import app
    app.logger.setLevel(level)
    app.logger.info(f"Log level set to {level_name}")

# if any of the config things need to do anything extra (ie set logging level) it happens here
# this is run after each time a config setting is changed via set-config-setting
def run_config_tasks():
    from app import app
    app.logger.info("Updating all nessecary config options")
    set_logger_level(config.get("LOGGER_LEVEL", "INFO"))

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


config = load_config()
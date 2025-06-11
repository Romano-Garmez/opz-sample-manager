import os
import json
import logging

CONFIG_PATH = "opz_sm_config.json"
app_config = {}

# Utility to read JSON from a file and return it as a Python object
def read_json_from_path(path):
    """Read JSON from a file and return its contents as a Python object."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
    with open(path, "r") as f:
        return json.load(f)

# Utility to write a Python object to a file as JSON
def write_json_to_path(path, data):
    """Write the provided data to the given path as formatted JSON."""
    with open(path, "w") as f:
        json.dump(data, f, indent=4)

# set the flask logger level
def set_logger_level(level_name: str):
    level_name = level_name.upper()
    level = getattr(logging, level_name, None)
    if not isinstance(level, int):
        raise ValueError(f"Invalid log level: {level_name}")

# if any of the config things need to do anything extra (ie set logging level) it happens here
# this is run after each time a config setting is changed via set-config-setting

def run_config_task(changed_key):

    match changed_key:
        case "LOGGER_LEVEL":
            set_logger_level(app_config.get("LOGGER_LEVEL", "INFO"))
        case _:
            None
            # could log something here

def run_all_config_tasks():

    for key in app_config.keys():
        run_config_task(key)




# Function to load the configuration from a JSON file
def load_config():
    from app import app
    if os.path.exists(CONFIG_PATH):
        loaded = read_json_from_path(CONFIG_PATH)
        app_config.clear()
        app_config.update(loaded)
    return app_config

# Function to save the configuration to a JSON file
def save_config():
    write_json_to_path(CONFIG_PATH, app_config)

# Function to reset configuration (clears file and memory)
def reset_config():
    write_json_to_path(CONFIG_PATH, {})
    app_config.clear()
    return app_config

# Get a config setting with an optional default
def get_config_setting(key, default=None):
    return app_config.get(key, default)

# Set a config setting and with option to not save it
def set_config_setting(key, value, save=True):
    app_config.get(key)
    app_config[key] = value
    if save:
        save_config()

# Optional: delete a config key, with option to not save
def delete_config_setting(key, save=True):
    if key in app_config:
        app_config.pop(key)
        if save:
            save_config()
        return True
    return False

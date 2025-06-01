import tkinter as tk
from tkinter import filedialog
import sys
import argparse

"""


    DO NOT CHANGE THE PRINT STATMENTS IN THIS TO THE LOGGER, IT WILL BREAK IT


"""


def show_dialog(mode):
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)

    match mode:
        case "file":
            path = filedialog.askopenfilename(title="Select a file")
        case "multi":
            paths = filedialog.askopenfilenames(title="Select one or more files")
            if paths:
                for p in paths:
                    print(p)
            return  # skip the rest
        case "folder":
            path = filedialog.askdirectory(title="Select a folder")
        case "save":
            path = filedialog.asksaveasfilename(title="Save file as")
        case _:
            print(f"Unknown mode: {mode}", file=sys.stderr)
            sys.exit(1)

    if path:
        print(path)

def main():
    parser = argparse.ArgumentParser(description="Launch a native file dialog")
    parser.add_argument("mode", choices=["file", "multi", "folder", "save"], help="Dialog mode")
    args = parser.parse_args()

    show_dialog(args.mode)

if __name__ == "__main__":
    main()

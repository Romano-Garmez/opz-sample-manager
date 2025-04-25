import sys
import threading
import requests
from PyQt5.QtWidgets import (
    QApplication,
    QMainWindow,
    QVBoxLayout,
    QWidget,
    QPushButton,
    QFileDialog,
    QLabel,
)
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl
import subprocess
import time


# Function to start the Flask app in a separate thread
def start_flask():
    subprocess.Popen(
        ["python", "app.py"]
    )  # Use "python" instead of "python3" for cross-platform compatibility
    time.sleep(2)  # Give Flask time to start


from PyQt5.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QFileDialog
)
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl
import requests

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("OP-Z Sample Manager")
        self.setGeometry(100, 100, 1280, 720)

        # Create a web view and load the Flask app
        self.browser = QWebEngineView()
        self.browser.setUrl(QUrl("http://127.0.0.1:5000"))

        # Create a small directory selection section
        self.select_dir_button = QPushButton("Select Directory")
        self.select_dir_button.setFixedHeight(30)
        self.select_dir_button.setMaximumWidth(150)
        self.select_dir_button.clicked.connect(self.select_directory)

        self.selected_dir_label = QLabel("No directory selected")
        self.selected_dir_label.setStyleSheet("font-size: 10pt;")
        self.selected_dir_label.setMaximumHeight(30)

        # Put the button + label in a small row
        bottom_layout = QHBoxLayout()
        bottom_layout.addWidget(self.select_dir_button)
        bottom_layout.addWidget(self.selected_dir_label)
        bottom_widget = QWidget()
        bottom_widget.setLayout(bottom_layout)

        # Combine browser + bottom row
        layout = QVBoxLayout()
        layout.addWidget(self.browser, stretch=1)  # 90% of vertical space
        layout.addWidget(bottom_widget, stretch=0) # minimal vertical space

        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

    def select_directory(self):
        directory = QFileDialog.getExistingDirectory(self, "Select Directory")
        if directory:
            self.selected_dir_label.setText(f"Selected Directory: {directory}")
            print(f"Selected Directory: {directory}")

            try:
                response = requests.post(
                    "http://127.0.0.1:5000/save-opz-dir",
                    json={"directory": directory},
                )
                if response.status_code == 200:
                    print("Directory sent to Flask backend successfully")
                    print("Response:", response.json())
                else:
                    print("Failed to send directory to Flask backend")
            except requests.exceptions.RequestException as e:
                print(f"Error sending directory to Flask backend: {e}")



if __name__ == "__main__":
    # Start Flask in a separate thread
    flask_thread = threading.Thread(target=start_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # Start the PyQt5 application
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())

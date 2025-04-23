import sys
import threading
from PyQt5.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl  # Import QUrl
import subprocess
import time

# Function to start the Flask app in a separate thread
def start_flask():
    subprocess.Popen(["python3", "app.py"])
    time.sleep(2)  # Give Flask time to start

# PyQt5 GUI Application
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("OP-Z Sample Manager")
        self.setGeometry(100, 100, 1280, 720)

        # Create a web view and load the Flask app
        self.browser = QWebEngineView()
        self.browser.setUrl(QUrl("http://127.0.0.1:5000"))  # Convert the string to QUrl

        # Set the layout
        layout = QVBoxLayout()
        layout.addWidget(self.browser)

        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

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
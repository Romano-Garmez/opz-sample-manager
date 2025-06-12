import sys
import threading
from PyQt5.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl
from PyQt5 import QtGui
import subprocess
import os
import signal

flask_process = None  # Global reference to the Flask process

# Start Flask using Popen
def start_flask():
    global flask_process
    flask_process = subprocess.Popen(
        [sys.executable, "app.py"]
    )

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("OP-Z Sample Manager")
        self.setWindowIcon(QtGui.QIcon(os.path.join(os.getcwd(), 'static', 'favicon.png')))
        self.setGeometry(100, 100, 1280, 720)

        self.browser = QWebEngineView()
        self.browser.setUrl(QUrl("http://127.0.0.1:5000"))

        layout = QVBoxLayout()
        layout.addWidget(self.browser, stretch=1)

        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

    def closeEvent(self, event):
        # Kill the Flask process when the window is closed
        global flask_process
        if flask_process:
            if os.name == "nt":
                flask_process.terminate()  # Windows
            else:
                os.kill(flask_process.pid, signal.SIGTERM)  # POSIX
            flask_process.wait()
        event.accept()

if __name__ == "__main__":
    flask_thread = threading.Thread(target=start_flask)
    flask_thread.start()

    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())

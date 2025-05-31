import sys
import threading
from PyQt5.QtWidgets import (
    QApplication,
    QMainWindow,
    QVBoxLayout,
    QWidget,
)
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl
from PyQt5 import QtGui
import subprocess
import os
import sys




# Function to start the Flask app in a separate thread
def start_flask():

    try:
        subprocess.run(
            [sys.executable, "app.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
    except Exception as e:
        return print(e)

from PyQt5.QtWidgets import (
    QMainWindow,
    QWidget,
    QVBoxLayout,
)
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("OP-Z Sample Manager")
        self.setWindowIcon(QtGui.QIcon(os.path.join(os.getcwd(), 'static', 'favicon.png')))
        self.setGeometry(100, 100, 1280, 720)

        # Create a web view and load the Flask app
        self.browser = QWebEngineView()
        self.browser.setUrl(QUrl("http://127.0.0.1:5000"))

        layout = QVBoxLayout()
        layout.addWidget(self.browser, stretch=1)  # 90% of vertical space

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

from flask import Flask, session, request, redirect, render_template
from flask_session import Session


app = Flask(__name__)



@app.route("/")
def index():
    return render_template("sampleloader.html")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)

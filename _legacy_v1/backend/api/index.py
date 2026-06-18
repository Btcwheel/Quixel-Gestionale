import os
os.environ["DISABLE_STARTUP_DB"] = "true"

from app.main import app

handler = app

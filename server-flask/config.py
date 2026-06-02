"""Server configuration from the environment.

None of these are ``PUBLIC_`` — they live only in the server process.
``GITHUB_TOKEN`` in particular must never reach the browser bundle.
"""

import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    service = "flask"
    port = int(os.environ.get("PORT", "8787"))
    # <owner>/<repo> the GitHub proxy + feedback endpoints act on.
    repo_slug = os.environ.get("REPO_SLUG", "ArtemioPadilla/inceptor")
    # Server-only GitHub token. Empty -> proxy unauthenticated, feedback 503s.
    github_token = os.environ.get("GITHUB_TOKEN", "")
    # Allowed CORS origin (the static site). "*" in dev.
    cors_origin = os.environ.get("CORS_ORIGIN", "*")
    # Optional downstream the form handlers forward to.
    contact_forward_url = os.environ.get("CONTACT_FORWARD_URL", "")
    newsletter_forward_url = os.environ.get("NEWSLETTER_FORWARD_URL", "")


config = Config()

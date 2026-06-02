"""Inceptor backend archetype — Flask + Pydantic. Mirrors server-node/'s API
exactly (ADR 0006). Run dev: ``flask --app app run --port 8787`` or ``python
app.py``. Prod: ``gunicorn 'app:create_app()'``.
"""

import requests
from flask import Flask, Response, jsonify, redirect, request
from flask_cors import CORS
from pydantic import ValidationError

from config import config
from github import GitHubError, create_issue, list_issues, repo_stats
from openapi import openapi_doc
from schemas import ContactModel, FeedbackModel, NewsletterModel

_SWAGGER_HTML = """<!doctype html>
<html><head><meta charset="utf-8"><title>Inceptor API</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head><body><div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>window.onload=()=>SwaggerUIBundle({url:'/api/openapi.json',dom_id:'#swagger-ui'});</script>
</body></html>"""


def _validation_error(exc: ValidationError) -> tuple[Response, int]:
    """422 with the same shape server-node returns."""
    return (
        jsonify(
            {
                "error": "validation_failed",
                "errors": [
                    {"path": ".".join(str(p) for p in e["loc"]), "message": e["msg"]}
                    for e in exc.errors()
                ],
            }
        ),
        422,
    )


def _deliver(forward_url: str, kind: str, payload: dict) -> None:
    if not forward_url:
        print(f"[forms] {kind} received (no forward URL set): {payload}")
        return
    res = requests.post(forward_url, json=payload, timeout=15)
    if not res.ok:
        raise RuntimeError(f"Forward to {kind} handler failed: {res.status_code}")


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, origins=config.cors_origin if config.cors_origin != "*" else "*")

    @app.get("/api/health")
    def health():
        return jsonify(
            {
                "status": "ok",
                "service": config.service,
                "repo": config.repo_slug,
                "githubAuth": "token" if config.github_token else "anonymous",
            }
        )

    @app.post("/api/contact")
    def contact():
        try:
            data = ContactModel(**(request.get_json(silent=True) or {}))
        except ValidationError as exc:
            return _validation_error(exc)
        _deliver(config.contact_forward_url, "contact", data.model_dump(exclude={"website"}))
        return jsonify({"ok": True, "received": "contact"})

    @app.post("/api/newsletter")
    def newsletter():
        try:
            data = NewsletterModel(**(request.get_json(silent=True) or {}))
        except ValidationError as exc:
            return _validation_error(exc)
        _deliver(config.newsletter_forward_url, "newsletter", data.model_dump(exclude={"website"}))
        return jsonify({"ok": True, "received": "newsletter"})

    @app.get("/api/issues")
    def issues():
        state = request.args.get("state", "open")
        if state not in ("open", "closed", "all"):
            state = "open"
        try:
            per_page = int(request.args.get("per_page", "30"))
        except ValueError:
            per_page = 30
        per_page = max(1, min(per_page, 100))
        return jsonify(list_issues(state, per_page))

    @app.get("/api/repo-stats")
    def stats():
        return jsonify(repo_stats())

    @app.post("/api/feedback")
    def feedback():
        try:
            data = FeedbackModel(**(request.get_json(silent=True) or {}))
        except ValidationError as exc:
            return _validation_error(exc)
        created = create_issue(data.title, data.body, data.labels)
        return jsonify(created), 201

    @app.get("/api/openapi.json")
    def openapi():
        return jsonify(openapi_doc())

    @app.get("/api/docs")
    def docs():
        return Response(_SWAGGER_HTML, mimetype="text/html")

    @app.get("/")
    def root():
        return redirect("/api/docs")

    @app.errorhandler(GitHubError)
    def on_github_error(err: GitHubError):
        return jsonify({"error": "github_error", "message": err.message}), err.status

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.port)

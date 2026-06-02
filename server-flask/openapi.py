"""OpenAPI 3.1 document — same shape as the Node archetype's. Request bodies
come from the Pydantic models via ``model_json_schema()`` (parallel to zod's
``z.toJSONSchema()``). The contract test diffs the two servers' specs.
"""

from schemas import ContactModel, FeedbackModel, NewsletterModel


def _body(model) -> dict:
    return {
        "required": True,
        "content": {"application/json": {"schema": model.model_json_schema()}},
    }


def _ok(description: str) -> dict:
    return {
        "description": description,
        "content": {"application/json": {"schema": {"type": "object"}}},
    }


def openapi_doc() -> dict:
    return {
        "openapi": "3.1.0",
        "info": {
            "title": "Inceptor backend API",
            "version": "0.1.0",
            "description": (
                "Self-hosted backend for Inceptor. Request bodies mirror the "
                "shared Zod schemas from src/schemas/. See ADR 0006."
            ),
        },
        "servers": [{"url": "/"}],
        "paths": {
            "/api/health": {
                "get": {"summary": "Liveness probe", "responses": {"200": _ok("Service is up")}}
            },
            "/api/contact": {
                "post": {
                    "summary": "Submit the contact form",
                    "requestBody": _body(ContactModel),
                    "responses": {"200": _ok("Accepted"), "422": _ok("Validation failed")},
                }
            },
            "/api/newsletter": {
                "post": {
                    "summary": "Subscribe to the newsletter",
                    "requestBody": _body(NewsletterModel),
                    "responses": {"200": _ok("Accepted"), "422": _ok("Validation failed")},
                }
            },
            "/api/issues": {
                "get": {
                    "summary": "List repo issues (token proxy, PRs filtered out)",
                    "parameters": [
                        {
                            "name": "state",
                            "in": "query",
                            "schema": {
                                "type": "string",
                                "enum": ["open", "closed", "all"],
                                "default": "open",
                            },
                        },
                        {
                            "name": "per_page",
                            "in": "query",
                            "schema": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 100,
                                "default": 30,
                            },
                        },
                    ],
                    "responses": {"200": _ok("Array of issues")},
                }
            },
            "/api/repo-stats": {
                "get": {
                    "summary": "Repo stars / forks / open issues",
                    "responses": {"200": _ok("Stats")},
                }
            },
            "/api/feedback": {
                "post": {
                    "summary": "Create a GitHub issue from in-app feedback",
                    "requestBody": _body(FeedbackModel),
                    "responses": {
                        "201": _ok("Issue created"),
                        "422": _ok("Validation failed"),
                        "503": _ok("Server has no GITHUB_TOKEN"),
                    },
                }
            },
        },
    }

"""Parity tests for the Flask archetype — same assertions as
server-node/test/app.test.ts."""

import json

import pytest

import github
from app import create_app


@pytest.fixture
def client():
    return create_app().test_client()


class FakeResponse:
    def __init__(self, payload, status=200):
        self._payload = payload
        self.status_code = status
        self.ok = 200 <= status < 300

    def json(self):
        return self._payload


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json()["service"] == "flask"


VALID_CONTACT = {
    "name": "Ada",
    "email": "ada@example.com",
    "message": "Hello there, friend.",
    "website": "",
}


def test_contact_valid(client):
    res = client.post("/api/contact", json=VALID_CONTACT)
    assert res.status_code == 200
    assert res.get_json() == {"ok": True, "received": "contact"}


def test_contact_bad_email(client):
    res = client.post("/api/contact", json={**VALID_CONTACT, "email": "nope"})
    assert res.status_code == 422
    body = res.get_json()
    assert body["error"] == "validation_failed"
    assert any(e["path"] == "email" for e in body["errors"])


def test_contact_honeypot(client):
    res = client.post("/api/contact", json={**VALID_CONTACT, "website": "http://spam"})
    assert res.status_code == 422


def test_newsletter(client):
    ok = client.post("/api/newsletter", json={"email": "a@b.com", "website": ""})
    bad = client.post("/api/newsletter", json={"email": "x", "website": ""})
    assert ok.status_code == 200
    assert bad.status_code == 422


def test_issues_filters_prs(client, monkeypatch):
    payload = [
        {"id": 1, "number": 1, "title": "a real issue", "html_url": "u", "state": "open",
         "user": {"login": "x", "avatar_url": ""}, "labels": [], "created_at": ""},
        {"id": 2, "number": 2, "title": "a PR", "html_url": "u", "state": "open",
         "user": {"login": "x", "avatar_url": ""}, "labels": [], "created_at": "",
         "pull_request": {"url": "p"}},
    ]
    monkeypatch.setattr(github.requests, "get", lambda *a, **k: FakeResponse(payload))
    res = client.get("/api/issues?state=open&per_page=30")
    data = res.get_json()
    assert len(data) == 1
    assert data[0]["title"] == "a real issue"


def test_issues_maps_failure(client, monkeypatch):
    monkeypatch.setattr(github.requests, "get", lambda *a, **k: FakeResponse("nope", 403))
    assert client.get("/api/issues").status_code == 403


def test_feedback_503_without_token(client):
    res = client.post(
        "/api/feedback",
        json={"title": "Bug report", "body": "Something broke on the page.", "website": ""},
    )
    assert res.status_code == 503


def test_openapi(client):
    doc = client.get("/api/openapi.json").get_json()
    assert doc["openapi"] == "3.1.0"
    for path in ("/api/contact", "/api/newsletter", "/api/issues", "/api/feedback"):
        assert path in doc["paths"]
    contact = doc["paths"]["/api/contact"]["post"]["requestBody"]["content"]["application/json"]
    body = contact["schema"]
    assert "email" in body["properties"]
    assert "message" in body["properties"]


def test_root_redirects(client):
    res = client.get("/")
    assert res.status_code == 302
    assert res.headers["Location"].endswith("/api/docs")


def test_contract_matches_node_golden():
    """The Flask OpenAPI paths/methods match the committed golden contract."""
    import os

    from openapi import openapi_doc

    golden_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "server-node", "openapi.golden.json"
    )
    if not os.path.exists(golden_path):
        pytest.fail(
            "golden contract missing — run `npm run gen:openapi` in server-node/ "
            "and commit openapi.golden.json (this test is the only cross-archetype "
            "parity guard; a silent skip defeats it)"
        )
    with open(golden_path) as f:
        golden = json.load(f)
    doc = openapi_doc()
    # Compare the API surface (paths + methods), not the generated body schemas
    # (Zod and Pydantic serialize JSON Schema slightly differently).
    def surface(spec):
        return {p: sorted(methods.keys()) for p, methods in spec["paths"].items()}

    assert surface(doc) == surface(golden)

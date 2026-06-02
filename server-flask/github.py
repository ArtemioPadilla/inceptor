"""Thin GitHub REST client. Lives server-side so the token never reaches the
browser and the 60 req/h unauthenticated cap is lifted when a token is set.
"""

import requests

from config import config

GH = "https://api.github.com"


class GitHubError(Exception):
    """Carries an HTTP status so the error handler can map it through."""

    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def _headers(extra: dict | None = None) -> dict:
    h = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "inceptor-server-flask",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if config.github_token:
        h["Authorization"] = f"Bearer {config.github_token}"
    if extra:
        h.update(extra)
    return h


def list_issues(state: str, per_page: int) -> list[dict]:
    url = f"{GH}/repos/{config.repo_slug}/issues?state={state}&per_page={per_page}"
    res = requests.get(url, headers=_headers(), timeout=15)
    if not res.ok:
        raise GitHubError(res.status_code, f"GitHub issues: {res.status_code}")
    raw = res.json()
    # Filter PRs out (the issues endpoint returns them with pull_request).
    return [
        {
            "id": i["id"],
            "number": i["number"],
            "title": i["title"],
            "html_url": i["html_url"],
            "state": i["state"],
            "user": {
                "login": (i.get("user") or {}).get("login", ""),
                "avatar_url": (i.get("user") or {}).get("avatar_url", ""),
            },
            "labels": [
                {"id": label["id"], "name": label["name"], "color": label["color"]}
                for label in i.get("labels", [])
            ],
            "created_at": i["created_at"],
        }
        for i in raw
        if "pull_request" not in i
    ]


def repo_stats() -> dict:
    res = requests.get(f"{GH}/repos/{config.repo_slug}", headers=_headers(), timeout=15)
    if not res.ok:
        raise GitHubError(res.status_code, f"GitHub repo: {res.status_code}")
    r = res.json()
    return {
        "full_name": r["full_name"],
        "description": r.get("description"),
        "stargazers_count": r["stargazers_count"],
        "forks_count": r["forks_count"],
        "open_issues_count": r["open_issues_count"],
        "html_url": r["html_url"],
    }


def create_issue(title: str, body: str, labels: list[str] | None) -> dict:
    if not config.github_token:
        raise GitHubError(503, "Feedback requires GITHUB_TOKEN on the server.")
    payload = {"title": title, "body": body}
    if labels:
        payload["labels"] = labels
    res = requests.post(
        f"{GH}/repos/{config.repo_slug}/issues",
        headers=_headers({"Content-Type": "application/json"}),
        json=payload,
        timeout=15,
    )
    if not res.ok:
        raise GitHubError(res.status_code, f"GitHub create issue: {res.status_code}")
    r = res.json()
    return {"url": r["html_url"], "number": r["number"]}

"""
The all-in-one image's API knows it is served under ``/api`` (issues #61, #63).

nginx serves the API at ``/api/`` and stripped the prefix before proxying,
while the API ran with an empty ``ROOT_PATH``. FastAPI therefore built every
URL without ``/api``: Swagger at ``/api/docs`` asked for ``/openapi.json``,
which nginx answered with the UI page (#61), and the trailing-slash redirect
for ``/api/ep`` pointed at ``http://localhost/ep/``, without the prefix or the
port (#63). These tests read the image's configuration files; the behaviour is
verified against a built image.
"""

import re
from pathlib import Path

DEPLOY = Path(__file__).resolve().parents[1] / "deploy"


def _api_location():
    text = (DEPLOY / "nginx-allinone.conf").read_text(encoding="utf-8")
    match = re.search(r"location /api/ \{(.*?)\n    \}", text, re.S)
    assert match, "nginx-allinone.conf no longer proxies /api/"
    return match.group(1)


def test_nginx_forwards_the_full_path():
    """No URI on proxy_pass: /api/x reaches the API as /api/x, and FastAPI's
    root_path strips the prefix for routing."""
    assert "proxy_pass http://127.0.0.1:8000;" in _api_location()


def test_nginx_forwards_the_host_with_its_port():
    block = _api_location()
    assert "proxy_set_header Host $http_host;" in block
    assert "proxy_set_header Host $host;" not in block


def test_the_api_runs_with_the_api_prefix():
    text = (DEPLOY / "supervisord.conf").read_text(encoding="utf-8")
    uvicorn = text.split("[program:uvicorn]", 1)[1].split("\n[", 1)[0]
    assert re.search(r'^environment=.*ROOT_PATH="/api"', uvicorn, re.M), uvicorn

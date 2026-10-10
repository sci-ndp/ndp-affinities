"""
docker-compose.prod.yml configures what it appears to (issue #62).

It passed ``VITE_API_URL`` and ``VITE_BASE_PATH`` to the frontend as build
arguments, which ``frontend/Dockerfile`` does not declare, so the UI always
started with the entrypoint defaults (API at ``http://localhost:8000``, base
path ``/``); and it gave the API no ``ROOT_PATH``. The frontend reads both at
container start (``frontend/entrypoint.sh``), as ``docker-compose.yml`` passes
them.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _service(name):
    """The text of one service in docker-compose.prod.yml."""
    text = (ROOT / "docker-compose.prod.yml").read_text(encoding="utf-8")
    match = re.search(rf"^  {name}:\n(.*?)(?=^  \S|^\S|\Z)", text, re.S | re.M)
    assert match, f"no {name} service"
    return match.group(1)


def test_the_frontend_gets_its_settings_at_run_time():
    frontend = _service("frontend")
    assert "args:" not in frontend
    environment = frontend.split("environment:", 1)[1]
    assert "ROOT_PATH:" in environment
    assert "VITE_API_URL:" in environment


def test_the_frontend_image_reads_what_compose_passes():
    entrypoint = (ROOT / "frontend" / "entrypoint.sh").read_text(encoding="utf-8")
    assert "ROOT_PATH" in entrypoint and "VITE_API_URL" in entrypoint


def test_the_api_gets_root_path():
    assert "ROOT_PATH:" in _service("api").split("environment:", 1)[1]

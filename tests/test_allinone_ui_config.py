"""
The all-in-one image tells its web UI where the API is (issue #60).

The UI reads the API address from ``config.js`` and, without it, falls back to
``http://localhost:8000``. Only ``frontend/entrypoint.sh`` (the UI-only image)
wrote that file, so in the all-in-one image ``/config.js`` answered 404 and the
UI called port 8000 on the viewer's own machine instead of this image's API at
``/api``.

The block that writes the file runs on its own, against a temporary folder, so
the test needs neither PostgreSQL nor nginx.
"""

import re
import shutil
import subprocess
from pathlib import Path

import pytest

ENTRYPOINT = Path(__file__).resolve().parents[1] / "deploy" / "entrypoint.sh"
BASH = shutil.which("bash")


def _ui_config_block():
    text = ENTRYPOINT.read_text(encoding="utf-8")
    match = re.search(r'^UI_DIR=.*?^EOF_CONFIG$', text, re.S | re.M)
    assert match, "deploy/entrypoint.sh does not write the UI's config.js"
    return match.group(0)


@pytest.mark.skipif(BASH is None, reason="needs bash")
def test_the_ui_is_pointed_at_the_bundled_api(tmp_path):
    subprocess.run(
        [BASH, "-c", _ui_config_block()],
        env={"UI_DIR": str(tmp_path), "PATH": "/usr/bin:/bin"},
        check=True,
    )

    config = (tmp_path / "config.js").read_text(encoding="utf-8")
    assert "window.__AFFINITIES_CONFIG__" in config
    assert 'apiUrl: "/api"' in config
    assert 'rootPath: "/"' in config


def test_the_config_is_written_before_the_services_start():
    text = ENTRYPOINT.read_text(encoding="utf-8")

    assert text.index("config.js") < text.index("exec /usr/bin/supervisord")

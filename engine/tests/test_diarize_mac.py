"""Who spoke when on a Mac: the FluidAudio helper, played here by a small script of our own."""

import json
import os
import stat
import sys
import tempfile

import numpy as np
import pytest

import diarize
from audio import RATE

TURNS = {"turns": [[0.0, 1.234, "S1"], [1.5, 3.0, "S2"]], "speakers": 2}


def fake_helper(tmp_path, body: str):
    script = tmp_path / "speakers-mac"
    script.write_text(f"#!{sys.executable}\nimport sys, json, os\n{body}\n")
    script.chmod(script.stat().st_mode | stat.S_IEXEC)
    return script


@pytest.fixture
def mac(monkeypatch, tmp_path):
    monkeypatch.setattr(sys, "platform", "darwin")
    models = tmp_path / "models"
    models.mkdir()
    monkeypatch.setattr(diarize, "MAC_MODELS", models)
    # Every temporary WAV lands here, so the test can see it is gone.
    temp = tmp_path / "temp"
    temp.mkdir()
    monkeypatch.setattr(tempfile, "tempdir", str(temp))
    return models, temp


def test_turns_and_progress_from_the_helper(mac, monkeypatch, tmp_path):
    models, temp = mac
    (models / "model.mlmodelc").mkdir()
    seen = tmp_path / "seen.json"
    helper = fake_helper(tmp_path, f"""
wav = sys.argv[-1]
json.dump({{"args": sys.argv[1:], "size": os.path.getsize(wav)}}, open({str(seen)!r}, "w"))
sys.stderr.write("progress 1 4\\nprogress 4 4\\n")
print({json.dumps(TURNS)!r})
""")
    monkeypatch.setenv("TYTS_SPEAKERS_HELPER", str(helper))
    assert diarize.status("", diarize.Setup()) == "ready"

    d = diarize.Diarizer()
    shares = []
    turns = d.diarize(np.zeros(2 * RATE, dtype=np.float32), "", 2, shares.append)

    assert turns == [(0.0, 1.23, "S1"), (1.5, 3.0, "S2")]
    assert shares == [0.25, 1.0]
    assert d.device == "ane" and not d.loaded
    called = json.loads(seen.read_text())
    assert called["args"][:4] == ["--models", str(models), "--speakers", "2"]
    assert called["size"] == 44 + 2 * 2 * RATE  # 16 kHz mono PCM16
    assert list(temp.iterdir()) == []
    assert d.voices == {}  # a helper from before 2026-11-09 gives no voice prints


def test_voice_prints_from_the_helper(mac, monkeypatch, tmp_path):
    models, _ = mac
    (models / "model.mlmodelc").mkdir()
    out = {**TURNS, "embeddings": {"S1": [0.5, 0.5], "S2": [1.0, 0.0]}}
    helper = fake_helper(tmp_path, f"print({json.dumps(out)!r})")
    monkeypatch.setenv("TYTS_SPEAKERS_HELPER", str(helper))
    d = diarize.Diarizer()
    assert d.diarize(np.zeros(2 * RATE, dtype=np.float32), "") == [(0.0, 1.23, "S1"), (1.5, 3.0, "S2")]
    assert d.voices == {"S1": [0.5, 0.5], "S2": [1.0, 0.0]}


def test_missing_models_is_a_missing_part(mac, monkeypatch, tmp_path):
    models, temp = mac
    (models / "model.mlmodelc").mkdir()
    helper = fake_helper(tmp_path, 'sys.stderr.write("missing models: Segmentation\\n"); sys.exit(3)')
    monkeypatch.setenv("TYTS_SPEAKERS_HELPER", str(helper))
    with pytest.raises(diarize.NeedsPart):
        diarize.Diarizer().diarize(np.zeros(2 * RATE, dtype=np.float32), "")
    assert list(temp.iterdir()) == []


def test_a_failure_says_the_helpers_line(mac, monkeypatch, tmp_path):
    models, _ = mac
    (models / "model.mlmodelc").mkdir()
    helper = fake_helper(tmp_path, 'sys.stderr.write("progress 0 1\\nthe audio could not be read\\n"); sys.exit(1)')
    monkeypatch.setenv("TYTS_SPEAKERS_HELPER", str(helper))
    with pytest.raises(RuntimeError, match="the audio could not be read"):
        diarize.Diarizer().diarize(np.zeros(2 * RATE, dtype=np.float32), "")


def test_no_key_on_a_mac(mac, monkeypatch, tmp_path):
    models, _ = mac
    monkeypatch.setenv("TYTS_SPEAKERS_HELPER", str(tmp_path / "nowhere"))
    setup = diarize.Setup()
    setup.start("hf_some_key")  # does nothing on a Mac
    assert setup.state != "checking"
    # Neither the helper nor the models: missing, never needs-token, and load says the part is missing.
    assert diarize.status("", setup) == "missing"
    with pytest.raises(diarize.NeedsPart):
        diarize.Diarizer().load("")
    # The helper but no models yet: still missing.
    helper = fake_helper(tmp_path, "pass")
    monkeypatch.setenv("TYTS_SPEAKERS_HELPER", str(helper))
    assert diarize.installed() and not diarize.downloaded()
    assert diarize.status("", setup) == "missing"
    with pytest.raises(diarize.NeedsPart):
        diarize.Diarizer().load("")
    (models / "model.mlmodelc").mkdir()
    assert diarize.status("", setup) == "ready"
    diarize.Diarizer().load("")  # no token, no torch


def test_a_helper_that_is_not_executable_is_not_installed(mac, monkeypatch, tmp_path):
    helper = fake_helper(tmp_path, "pass")
    helper.chmod(0o644)
    monkeypatch.setenv("TYTS_SPEAKERS_HELPER", str(helper))
    assert not diarize.installed()


def test_the_helper_is_found_beside_the_engine(monkeypatch):
    monkeypatch.delenv("TYTS_SPEAKERS_HELPER", raising=False)
    engine = os.path.dirname(os.path.abspath(diarize.__file__))
    assert str(diarize.helper()) == os.path.join(os.path.dirname(engine), "vendor", "speakers-mac")

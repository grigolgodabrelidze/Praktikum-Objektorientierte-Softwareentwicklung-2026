# tests/test_script_parser.py
import pytest
import os
import tempfile
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "src")))
from script_parser import ScriptParser

def test_load_chapter_text_success():
    """Testet, ob eine existierende Datei korrekt eingelesen wird."""
    # Erstelle ein temporäres Verzeichnis und eine Testdatei
    with tempfile.TemporaryDirectory() as temp_dir:
        test_file = "kapitel_test.txt"
        test_content = "Dies ist ein Test-Inhalt für das AP-Skript."
        
        with open(os.path.join(temp_dir, test_file), "w", encoding="utf-8") as f:
            f.write(test_content)
            
        # Parser auf das temporäre Verzeichnis ansetzen
        parser = ScriptParser(data_dir=temp_dir)
        content = parser.load_chapter_text(test_file)
        
        assert content == test_content

def test_load_chapter_text_not_found():
    """Testet, ob ein FileNotFoundError geworfen wird, wenn die Datei fehlt."""
    parser = ScriptParser(data_dir="non_existent_directory")
    
    with pytest.raises(FileNotFoundError):
        parser.load_chapter_text("imaginary_file.txt")
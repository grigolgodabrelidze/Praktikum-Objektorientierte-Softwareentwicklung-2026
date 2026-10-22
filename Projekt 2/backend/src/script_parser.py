# backend/src/script_parser.py
import os
from pypdf import PdfReader

class ScriptParser:
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            self.data_dir = os.path.join(base_dir, "data")
        else:
            self.data_dir = os.path.abspath(data_dir)

    def load_chapter_text(self, filename: str) -> str:
        file_path = os.path.join(self.data_dir, filename)
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(
                f"Die Skriptdatei '{filename}' wurde nicht gefunden."
            )
            
        try:
            # NEU: Unterscheidung zwischen PDF und normalem Text
            if filename.lower().endswith(".pdf"):
                text = ""
                reader = PdfReader(file_path)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
                return text.strip()
            else:
                with open(file_path, "r", encoding="utf-8") as f:
                    return f.read().strip()
        except Exception as e:
            raise IOError(f"Fehler beim Lesen der Datei '{filename}': {str(e)}")
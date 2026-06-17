import os
import json
import threading

# Define path relative to the project root (assuming this file is in src/services/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
CACHE_FILE = os.path.join(PROJECT_ROOT, "translation_cache.json")

class TranslationCache:
    def __init__(self, cache_file=CACHE_FILE):
        self.cache_file = cache_file
        self.lock = threading.Lock()
        self.cache = self._load_cache()

    def _load_cache(self):
        if not os.path.exists(self.cache_file):
            return {}
        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading translation cache: {e}")
            return {}

    def _save_cache(self):
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self.cache, f, ensure_ascii=False, indent=4)
        except Exception as e:
            print(f"Error saving translation cache: {e}")

    def get(self, text: str, target_lang: str):
        """
        Retrieve cached translation.
        """
        with self.lock:
            if text in self.cache and target_lang in self.cache[text]:
                return self.cache[text][target_lang]
            return None

    def set(self, text: str, target_lang: str, translation: str):
        """
        Store translation in cache and persist to disk.
        """
        with self.lock:
            if text not in self.cache:
                self.cache[text] = {}
            self.cache[text][target_lang] = translation
            self._save_cache()

import re

def refine_sentence(text: str) -> str:
    """
    Improves sentence formatting by applying capitalization and intelligent punctuation.
    """
    if not text:
        return ""
    
    try:
        text = text.strip()
        if not text:
            return ""
            
        # Add comma before please at the end of the sentence
        if text.lower().endswith(" please") and not text.lower().endswith(", please"):
            text = text[:-7] + ", please"
            
        # Capitalize first letter
        text = text[0].upper() + text[1:]
        
        # Add ending punctuation if missing
        lower_text = text.lower()
        if not re.search(r'[.!?]$', text):
            question_words = ("how ", "what ", "can ", "why ", "where ", "who ", "when ", 
                              "is ", "are ", "do ", "does ", "did ", "could ", "would ", 
                              "should ", "may ", "might ")
            
            if any(lower_text.startswith(qw) for qw in question_words):
                text += "?"
            elif any(greet in lower_text for greet in ["good morning", "good afternoon", "good evening", "congratulations", "excellent", "wow", "amazing"]):
                text += "!"
            else:
                text += "."
                
        return text
    except Exception as e:
        print(f"Sentence refinement error: {e}")
        return text

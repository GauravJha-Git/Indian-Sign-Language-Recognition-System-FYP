import os
import tempfile
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import numpy as np
from tensorflow.keras.models import load_model

from src.data_preprocessing import extract_frames, SEQUENCE_LENGTH
from src.feature_extraction import extract_video_keypoints
from src.predict import text_to_speech
from deep_translator import GoogleTranslator

app = FastAPI(title="Sign Language Recognition API")

LANGUAGES = {
    "English": "en",
    "Hindi": "hi",
    "Bengali": "bn",
    "Tamil": "ta",
    "Telugu": "te",
    "Marathi": "mr",
    "Gujarati": "gu",
    "Kannada": "kn",
    "Malayalam": "ml",
    "Punjabi": "pa",
    "Urdu": "ur",
    "Odia": "or",
    "Assamese": "as",
    "French": "fr",
    "German": "de",
    "Spanish": "es",
    "Italian": "it",
    "Portuguese": "pt",
    "Dutch": "nl",
    "Russian": "ru",
    "Turkish": "tr",
    "Arabic": "ar",
    "Chinese": "zh-CN",
    "Japanese": "ja",
    "Korean": "ko"
}

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static directory for audio
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
AUDIO_DIR = os.path.join(STATIC_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Global variables to hold model artifacts
MODEL = None
CLASSES = None
NORM_MEAN = None
NORM_STD = None

@app.on_event("startup")
async def load_artifacts():
    global MODEL, CLASSES, NORM_MEAN, NORM_STD
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    
    model_path = os.path.join(models_dir, "sign_language_model.h5")
    classes_path = os.path.join(models_dir, "label_encoder.npy")
    norm_path = os.path.join(models_dir, "norm_stats.npz")
    
    if not os.path.exists(model_path):
        print(f"Warning: Model not found at {model_path}")
        return
        
    MODEL = load_model(model_path)
    CLASSES = np.load(classes_path, allow_pickle=True)
    norm = np.load(norm_path)
    NORM_MEAN = norm['mean']
    NORM_STD = norm['std']
    print("Model artifacts loaded successfully.")

@app.post("/predict")
async def predict_video(video: UploadFile = File(...), language: str = Form("English")):
    if MODEL is None:
        raise HTTPException(status_code=500, detail="Model is not loaded. Please train the model first.")
        
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            tmp.write(await video.read())
            tmp_path = tmp.name

        # Extract frames
        frames = extract_frames(tmp_path, SEQUENCE_LENGTH)
        if frames is None:
            raise HTTPException(status_code=400, detail="Could not read the video. Please upload a valid file.")

        # Extract keypoints
        keypoints = extract_video_keypoints(frames)

        # Normalize
        keypoints = (keypoints - NORM_MEAN) / (NORM_STD + 1e-8)

        # Predict
        X = keypoints[np.newaxis, ...]
        probs = MODEL.predict(X, verbose=0)[0]
        predicted_idx = int(np.argmax(probs))
        predicted_label = str(CLASSES[predicted_idx])
        confidence = float(probs[predicted_idx])

        # Translation
        lang_code = LANGUAGES.get(language, "en")
        translated_text = predicted_label
        if lang_code != "en":
            try:
                translated_text = GoogleTranslator(source='en', target=lang_code).translate(predicted_label)
            except Exception as e:
                print(f"Translation failed: {e}")
                translated_text = predicted_label
                lang_code = "en"

        # Text to Speech
        audio_filename = f"output_{uuid.uuid4().hex}.mp3"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        text_to_speech(translated_text, audio_path, lang=lang_code)
        
        # Cleanup temp video file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

        return {
            "original_prediction": predicted_label,
            "translated_text": translated_text,
            "selected_language": language,
            "language_code": lang_code,
            "confidence": confidence,
            "audio_url": f"/static/audio/{audio_filename}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

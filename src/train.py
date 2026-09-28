"""
train.py
--------
Training pipeline:

1. Load original videos
2. Split ORIGINAL videos into train/validation
3. Extract MobileNetV2 features
4. Augment training data ONLY
5. Normalize using training statistics
6. Train 1D CNN + Bi-LSTM
7. Save model, encoder and normalization statistics
8. Save training graphs
"""

import os
import sys

import numpy as np

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint
)


# ==========================================================
# Add project root to Python path
# ==========================================================

sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(__file__)
    )
)


from src.data_preprocessing import (
    load_dataset,
    SEQUENCE_LENGTH
)

from src.feature_extraction import (
    extract_dataset_features,
    augment_training_data,
    MOBILENET_FEATURE_DIM
)

from src.model import build_model


# ==========================================================
# Paths
# ==========================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(__file__)
)

MODELS_DIR = os.path.join(
    PROJECT_ROOT,
    "models"
)

MODEL_PATH = os.path.join(
    MODELS_DIR,
    "sign_language_model.h5"
)

ENCODER_PATH = os.path.join(
    MODELS_DIR,
    "label_encoder.npy"
)

NORM_PATH = os.path.join(
    MODELS_DIR,
    "norm_stats.npz"
)

HISTORY_PLOT_PATH = os.path.join(
    MODELS_DIR,
    "training_history.png"
)


# ==========================================================
# Plot training history
# ==========================================================

def plot_history(history, save_path):

    fig, (ax1, ax2) = plt.subplots(
        1,
        2,
        figsize=(14, 5)
    )

    # Accuracy
    ax1.plot(
        history.history["accuracy"],
        label="Train Accuracy",
        linewidth=2
    )

    ax1.plot(
        history.history["val_accuracy"],
        label="Validation Accuracy",
        linewidth=2
    )

    ax1.set_title(
        "Model Accuracy"
    )

    ax1.set_xlabel(
        "Epoch"
    )

    ax1.set_ylabel(
        "Accuracy"
    )

    ax1.legend()
    ax1.grid(
        True,
        alpha=0.3
    )

    # Loss
    ax2.plot(
        history.history["loss"],
        label="Train Loss",
        linewidth=2
    )

    ax2.plot(
        history.history["val_loss"],
        label="Validation Loss",
        linewidth=2
    )

    ax2.set_title(
        "Model Loss"
    )

    ax2.set_xlabel(
        "Epoch"
    )

    ax2.set_ylabel(
        "Loss"
    )

    ax2.legend()
    ax2.grid(
        True,
        alpha=0.3
    )

    plt.tight_layout()

    plt.savefig(
        save_path,
        dpi=150
    )

    plt.close()

    print(
        f"[INFO] Training history saved → "
        f"{save_path}"
    )


# ==========================================================
# Main training function
# ==========================================================

def main():

    os.makedirs(
        MODELS_DIR,
        exist_ok=True
    )

    # ======================================================
    # STEP 1 — Load original videos
    # ======================================================

    print("=" * 60)
    print("STEP 1 / 6 — Loading videos")
    print("=" * 60)

    videos, labels, class_names = load_dataset()

    if len(videos) < 12:
        raise ValueError(
            "Dataset is too small for training."
        )

    print(
        f"[INFO] Total original videos: "
        f"{len(videos)}"
    )

    print(
        f"[INFO] Classes: "
        f"{class_names}"
    )

    # ======================================================
    # STEP 2 — Encode labels
    # ======================================================

    print("\n" + "=" * 60)
    print("STEP 2 / 6 — Encoding labels")
    print("=" * 60)

    label_encoder = LabelEncoder()

    y_encoded = label_encoder.fit_transform(
        labels
    )

    num_classes = len(
        label_encoder.classes_
    )

    print(
        f"[INFO] Number of classes: "
        f"{num_classes}"
    )

    print(
        f"[INFO] Class names: "
        f"{list(label_encoder.classes_)}"
    )

    # Save label names
    np.save(
        ENCODER_PATH,
        label_encoder.classes_
    )

    print(
        f"[INFO] Label encoder saved → "
        f"{ENCODER_PATH}"
    )

    # ======================================================
    # STEP 3 — Split ORIGINAL VIDEOS
    # ======================================================
    #
    # CHANGED:
    # We split BEFORE augmentation.
    #
    # This prevents augmented copies of the same video
    # from entering validation data.
    # ======================================================

    print("\n" + "=" * 60)
    print("STEP 3 / 6 — Splitting original videos")
    print("=" * 60)

    indices = np.arange(
        len(videos)
    )

    train_indices, val_indices = train_test_split(
        indices,
        test_size=0.20,
        random_state=42,
        stratify=y_encoded
    )

    train_videos = [
        videos[i]
        for i in train_indices
    ]

    val_videos = [
        videos[i]
        for i in val_indices
    ]

    y_train = y_encoded[
        train_indices
    ]

    y_val = y_encoded[
        val_indices
    ]

    print(
        f"[INFO] Original training videos: "
        f"{len(train_videos)}"
    )

    print(
        f"[INFO] Original validation videos: "
        f"{len(val_videos)}"
    )

    # ======================================================
    # STEP 4 — MobileNetV2 feature extraction
    # ======================================================

    print("\n" + "=" * 60)
    print("STEP 4 / 6 — MobileNetV2 feature extraction")
    print("=" * 60)

    X_train = extract_dataset_features(
        train_videos
    )

    X_val = extract_dataset_features(
        val_videos
    )

    print(
        f"[INFO] X_train before augmentation: "
        f"{X_train.shape}"
    )

    print(
        f"[INFO] X_val: "
        f"{X_val.shape}"
    )

    # ======================================================
    # CHANGED:
    # Augment TRAINING data only.
    #
    # 3 augmented copies per original training video.
    # ======================================================

    NUM_AUGMENTS = 2

    print(
        f"\n[INFO] Augmenting training data "
        f"({NUM_AUGMENTS} copies/video)..."
    )

    X_train, y_train = augment_training_data(
        X_train,
        y_train,
        num_augments=NUM_AUGMENTS
    )

    print(
        f"[INFO] X_train after augmentation: "
        f"{X_train.shape}"
    )

    print(
        f"[INFO] y_train shape: "
        f"{y_train.shape}"
    )

    # ======================================================
    # CHANGED:
    # Normalize using TRAINING data only.
    #
    # Validation data uses the same training mean/std.
    # ======================================================

    print(
        "\n[INFO] Normalizing features..."
    )

    norm_mean = X_train.mean(
        axis=(0, 1),
        keepdims=True
    )

    norm_std = X_train.std(
        axis=(0, 1),
        keepdims=True
    ) + 1e-8

    X_train = (
        X_train - norm_mean
    ) / norm_std

    X_val = (
        X_val - norm_mean
    ) / norm_std

    # Save normalization statistics
    np.savez(
        NORM_PATH,
        mean=norm_mean.squeeze(),
        std=norm_std.squeeze()
    )

    print(
        f"[INFO] Normalization stats saved → "
        f"{NORM_PATH}"
    )

    # ======================================================
    # STEP 5 — Build and train model
    # ======================================================

    print("\n" + "=" * 60)
    print("STEP 5 / 6 — Building & training model")
    print("=" * 60)

    # Convert labels to one-hot
    y_train_cat = to_categorical(
        y_train,
        num_classes=num_classes
    )

    y_val_cat = to_categorical(
        y_val,
        num_classes=num_classes
    )

    # ======================================================
    # CHANGED:
    # New architecture:
    #
    # MobileNetV2 → 1D CNN → Bi-LSTM
    # ======================================================

    model = build_model(
        sequence_length=SEQUENCE_LENGTH,
        feature_dim=MOBILENET_FEATURE_DIM,
        num_classes=num_classes,
        dropout_rate=0.5
    )

    # ======================================================
    # CHANGED:
    # Monitor val_accuracy instead of val_loss.
    #
    # Your previous run restored Epoch 1 because
    # EarlyStopping was monitoring val_loss.
    # ======================================================

    callbacks = [

        EarlyStopping(
            monitor="val_accuracy",
            mode="max",
            patience=15,
            restore_best_weights=True,
            verbose=1
        ),

        ReduceLROnPlateau(
            monitor="val_loss",
            mode="min",
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1
        ),

        ModelCheckpoint(
            MODEL_PATH,
            monitor="val_accuracy",
            mode="max",
            save_best_only=True,
            verbose=1
        )
    ]

    # ======================================================
    # CHANGED:
    # 80 maximum epochs.
    # EarlyStopping can stop earlier.
    # ======================================================

    history = model.fit(

        X_train,
        y_train_cat,

        validation_data=(
            X_val,
            y_val_cat
        ),

        epochs=80,

        # Small dataset → small batch
        batch_size=8,

        callbacks=callbacks,

        verbose=1
    )

    # ======================================================
    # STEP 6 — Final results
    # ======================================================

    print("\n" + "=" * 60)
    print("STEP 6 / 6 — Results")
    print("=" * 60)

    val_loss, val_accuracy = model.evaluate(
        X_val,
        y_val_cat,
        verbose=0
    )

    print(
        f"\nValidation Accuracy: "
        f"{val_accuracy * 100:.2f}%"
    )

    print(
        f"Validation Loss: "
        f"{val_loss:.4f}"
    )

    print(
        f"Model saved → "
        f"{MODEL_PATH}"
    )

    # Save graphs
    plot_history(
        history,
        HISTORY_PLOT_PATH
    )

    print(
        "\n=========================================="
    )

    print(
        "Training complete!"
    )

    print(
        "=========================================="
    )

    return val_accuracy


# ==========================================================
# Run training
# ==========================================================

if __name__ == "__main__":
    main()

"""
feature_extraction.py
---------------------
MobileNetV2 frame feature extraction.

NEW PIPELINE:
Video Frames → MobileNetV2 → 1280 features/frame
             → 30 × 1280 sequence
             → 1D CNN → Bi-LSTM
"""

import numpy as np
import tensorflow as tf

from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# ──────────────────────────────────────────────
# CHANGED: MobileNetV2 configuration
# ──────────────────────────────────────────────
IMAGE_SIZE = (224, 224)
MOBILENET_FEATURE_DIM = 1280

# CHANGED: Load pretrained MobileNetV2.
# include_top=False + pooling="avg" gives 1280 features per frame.
mobilenet = MobileNetV2(
    weights="imagenet",
    include_top=False,
    pooling="avg",
    input_shape=(224, 224, 3)
)

# CHANGED: Freeze MobileNetV2 because the dataset is very small.
mobilenet.trainable = False


def extract_video_features(frames: np.ndarray) -> np.ndarray:
    """
    Convert one video into a sequence of MobileNetV2 features.

    Input:
        frames: (30, H, W, 3)

    Output:
        features: (30, 1280)
    """

    # CHANGED: Resize frames for MobileNetV2.
    frames_resized = tf.image.resize(
        frames,
        IMAGE_SIZE
    )

    # CHANGED: Convert to float32 and apply MobileNetV2 preprocessing.
    frames_resized = tf.cast(
        frames_resized,
        tf.float32
    )

    frames_preprocessed = preprocess_input(
        frames_resized
    )

    # CHANGED: Extract 1280-dimensional feature vector for each frame.
    features = mobilenet.predict(
        frames_preprocessed,
        batch_size=8,
        verbose=0
    )

    return features.astype(np.float32)


def extract_dataset_features(videos: list) -> np.ndarray:
    """
    Extract MobileNetV2 features from all videos.

    Output:
        X shape = (number_of_videos, 30, 1280)
    """

    all_features = []

    total = len(videos)

    for i, frames in enumerate(videos):
        print(
            f"  Extracting MobileNetV2 features "
            f"{i + 1}/{total}"
        )

        features = extract_video_features(frames)

        all_features.append(features)

    return np.array(
        all_features,
        dtype=np.float32
    )


# ──────────────────────────────────────────────
# CHANGED: Feature-level augmentation
# ──────────────────────────────────────────────
def augment_feature_sequence(sequence: np.ndarray, num_augments: int = 5) -> list:
    """
    Create augmented copies of a MobileNetV2 feature sequence.

    Input:
        sequence: (30, 1280)

    Output:
        list of augmented sequences.
    """

    augmented = []

    for _ in range(num_augments):

        aug = sequence.copy()

        # 1. Small Gaussian noise
        noise_scale = np.random.uniform(
            0.005,
            0.02
        )

        noise = np.random.normal(
            0,
            noise_scale,
            aug.shape
        ).astype(np.float32)

        aug = aug + noise

        # 2. Temporal shift
        if np.random.random() < 0.5:
            shift = np.random.randint(-2, 3)
            aug = np.roll(
                aug,
                shift,
                axis=0
            )

        # 3. Feature scaling
        if np.random.random() < 0.2:
            scale = np.random.uniform(
                0.95,
                1.05
            )
            aug = aug * scale

        # 4. Random frame dropout
        if np.random.random() < 0.1:
            n_drop = np.random.randint(1, 3)

            drop_indices = np.random.choice(
                len(aug),
                n_drop,
                replace=False
            )

            # Replace dropped frames with neighbouring information
            for idx in drop_indices:
                if idx == 0:
                    aug[idx] = aug[idx + 1]
                elif idx == len(aug) - 1:
                    aug[idx] = aug[idx - 1]
                else:
                    aug[idx] = (
                        aug[idx - 1] +
                        aug[idx + 1]
                    ) / 2.0

        augmented.append(
            aug.astype(np.float32)
        )

    return augmented


def augment_training_data(
    X: np.ndarray,
    y: np.ndarray,
    num_augments: int = 5
):
    """
    Augment ONLY training videos.

    This is intentionally separate from validation data to
    reduce data leakage.
    """

    X_out = [x for x in X]
    y_out = [y_i for y_i in y]

    for x, y_i in zip(X, y):

        augmented_sequences = augment_feature_sequence(
            x,
            num_augments=num_augments
        )

        for aug in augmented_sequences:
            X_out.append(aug)
            y_out.append(y_i)

    return (
        np.array(X_out, dtype=np.float32),
        np.array(y_out, dtype=np.int32)
    )

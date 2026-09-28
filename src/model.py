"""
model.py
--------
LSTM-based model for sign language sequence classification.
"""

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Input,
    Conv1D,
    BatchNormalization,
    MaxPooling1D,
    Bidirectional,
    LSTM,
    Dense,
    Dropout,
    ReLU
)
from tensorflow.keras.optimizers import Adam


def build_model(
    sequence_length: int = 30,
    feature_dim: int = 1280,
    num_classes: int = 6,
    dropout_rate: float = 0.5
) -> Sequential:
    """
    Build a stacked-LSTM classifier.

    Architecture
    ------------
    Input → LSTM(128) → BatchNorm → Dropout →
            LSTM(64)  → BatchNorm → Dropout →
            Dense(64, relu) → Dropout →
            Dense(num_classes, softmax)

    Parameters
    ----------
    sequence_length : int   – timesteps (frames)
    feature_dim : int       – features per frame (258 for pose+hands)
    num_classes : int       – number of output classes
    lstm_units : tuple      – units for each LSTM layer
    dropout_rate : float    – dropout probability

    Returns
    -------
    Compiled Keras Sequential model
    """
    model = Sequential([
        # Input layer
        Input(shape=(sequence_length, feature_dim)),

        # ======================================================
        # 1D CNN
        # ======================================================
        # CHANGED:
        # 1D CNN works over the temporal sequence of frames.
        Conv1D(
            filters=64,    #changed: reduce LSTM units to reduce overfitting
            kernel_size=3,
            padding="same"
        ),

        BatchNormalization(),

        ReLU(),

        # Reduce temporal size
        MaxPooling1D(
            pool_size=2
        ),

        Dropout(0.20),

        # ======================================================
        # Bi-LSTM
        # ======================================================
        # CHANGED:
        # Using ONE Bi-LSTM instead of two stacked Bi-LSTMs
        # to reduce overfitting for the small dataset.
        Bidirectional(
            LSTM(
                128,     #changed: reduce LSTM units to reduce overfitting
                return_sequences=False
            )
        ),

        Dropout(0.20),

        # ======================================================
        # Classifier
        # ======================================================
        Dense(
            64,      #changed: reduce LSTM units to reduce overfitting
            activation="relu"
        ),

        Dropout(0.20),

        # ======================================================
        # Output
        # ======================================================
        Dense(
            num_classes,
            activation="softmax"
        )
    ])

    # ==========================================================
    # CHANGED:
    # Lower learning rate to make training more stable.
    # ==========================================================
    optimizer = Adam(
        learning_rate=1e-3          #changed: reduce learning rate to make training more stable
    )

    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    model.summary()
    return model


# ──────────────────────────────────────────────
# Quick sanity check
# ──────────────────────────────────────────────
if __name__ == "__main__":
    model = build_model()           #changes m to model to m to avoid confusion with the model module
    print(f"\nTotal params: {model.count_params():,}")

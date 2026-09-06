import numpy as np
import pandas as pd


ACCEL_COLUMNS = [
    "ACCELEROMETER X (m/s²)",
    "ACCELEROMETER Y (m/s²)",
    "ACCELEROMETER Z (m/s²)",
]

GYRO_COLUMNS = [
    "GYROSCOPE Yaw (rad/s)",
    "GYROSCOPE Pitch (rad/s)",
    "GYROSCOPE Roll (rad/s)",
]


def add_sensor_augmentation(
    df,
    scale_range=(0.98, 1.02),
    noise_fraction=0.02,
    random_seed=42,
):
    """
    Add sensor scaling and Gaussian noise.

    The original dataframe is not modified.
    """

    rng = np.random.default_rng(random_seed)

    # Work on a copy so the original dataset stays unchanged.
    augmented = df.copy()

    sensor_columns = ACCEL_COLUMNS + GYRO_COLUMNS

    for column in sensor_columns:

        # Random sensor calibration scale.
        scale = rng.uniform(*scale_range)

        values = augmented[column].to_numpy(dtype=float)

        # Noise level based on observed variation.
        noise_std = values.std() * noise_fraction

        noise = rng.normal(
            loc=0.0,
            scale=noise_std,
            size=len(values),
        )

        augmented[column] = values * scale + noise

    return augmented


if __name__ == "__main__":

    import sys

    sys.path.insert(
        0,
        str(__file__).replace("\\", "/").rsplit("/src/data", 1)[0]
        + "/src/data"
    )

    from loader import load_io_vnbd

    # Load original dataset.
    df = load_io_vnbd()

    # Create augmented copy.
    augmented_df = add_sensor_augmentation(df)

    sensor_columns = ACCEL_COLUMNS + GYRO_COLUMNS

    print("===== AUGMENTATION TEST =====")
    print(f"Original rows:  {len(df)}")
    print(f"Augmented rows: {len(augmented_df)}")

    print("\n===== ORIGINAL vs AUGMENTED =====")

    for column in sensor_columns:

        original_std = df[column].std()
        augmented_std = augmented_df[column].std()

        print(f"\n{column}")
        print(f"  Original std:  {original_std:.6f}")
        print(f"  Augmented std: {augmented_std:.6f}")
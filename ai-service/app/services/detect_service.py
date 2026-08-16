from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import cv2
import joblib
import numpy as np
from skimage.feature import graycomatrix, graycoprops, hog, local_binary_pattern

# Must match disease_predict.ipynb training pipeline
IMG_SIZE = (128, 128)
HOG_PARAMS = dict(
    orientations=9,
    pixels_per_cell=(16, 16),
    cells_per_block=(2, 2),
    block_norm="L2-Hys",
)
LBP_RADIUS = 3
LBP_POINTS = 8 * LBP_RADIUS
GLCM_DISTANCES = [1, 2, 4]
GLCM_ANGLES = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]
GLCM_PROPERTIES = ["contrast", "dissimilarity", "homogeneity", "energy", "correlation", "ASM"]

# class_names = sorted(unique labels) from training notebook
CLASS_NAMES = [
    "Bacterial Leaf Blight",
    "Brown Spot",
    "Healthy Rice Leaf",
    "Leaf Blast",
    "Leaf Scald",
    "Sheath Blight",
]

# Map notebook labels → Smart Agro app disease names
APP_DISEASE_NAMES = {
    "Bacterial Leaf Blight": "Bacterial Leaf Blight",
    "Brown Spot": "Brown Spot",
    "Healthy Rice Leaf": "Healthy",
    "Leaf Blast": "Blast",
    "Leaf Scald": "Leaf Scald",
    "Sheath Blight": "Sheath Blight",
}

TREATMENT_MY = {
    "Blast": "မှိုသတ်ဆေး အသုံးပြုပြီး ရေသွင်းရေထုတ် ကောင်းမွန်အောင် ထိန်းသိမ်းပါ။",
    "Brown Spot": "မျိုးစေ့ကို သန့်ရှင်းစွာ ရွေးချယ်ပြီး မြေဩဇာ မျှတစွာ ထည့်ပါ။",
    "Bacterial Leaf Blight": "ရောဂါကျ ပင်များကို ဖယ်ရှားပြီး ရေလျှံမှု ရှောင်ပါ။",
    "Sheath Blight": "အပင်ကြားအကွာအဝေး မှန်ကန်စွာ စိုက်ပြီး မှိုသတ်ဆေး သုံးပါ။",
    "Leaf Scald": "ရေသွင်းရေထုတ် ထိန်းညှိပြီး ရောဂါခံနိုင်သော မျိုးရွေးချယ်ပါ။ မှိုသတ်ဆေးလိုအပ်ပါက အသုံးပြုပါ။",
    "Leaf Smut": "သန့်ရှင်းသော မျိုးစေ့ အသုံးပြုပြီး ကွင်းသန့်ရှင်းရေး လုပ်ပါ။",
    "Tungro": "ပိုးမွှား ထိန်းချုပ်ရေး နှင့် ရောဂါခံနိုင်သော မျိုးများ ရွေးချယ်ပါ။",
    "Yellow Stem Borer": "ပင်သေ/နှံဖြူပင် ဖယ်ပါ။ လိုအပ်မှ Cartap / Chlorantraniliprole သုံးပါ။",
    "Brown Planthopper": "နိုက်ထရိုဂျင် မလွန်ပါနှင့်။ လိုအပ်မှ Buprofezin / Pymetrozine သုံးပါ။",
    "Rice Leaf Folder": "ရွက်လိပ်များ ဖယ်ပါ။ လိုအပ်မှ Cartap / Chlorantraniliprole သုံးပါ။",
    "Rice Gall Midge": "ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ငွေရောင်ပင် ဖယ်ပါ။",
    "Rice Hispa": "ပေါင်းရှင်းပါ။ လိုအပ်မှ Malathion / Lambda-cyhalothrin သုံးပါ။",
    "Healthy": "စပါးပင် ကျန်းမာနေပါသည်။ ပုံမှန် စောင့်ကြည့်ပါ။",
}

MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "trained_rice_model.pkl"

# Out-of-domain gates (closed-set rice model has no "Other" class)
MIN_TOP_CONFIDENCE = 0.55
MIN_TOP_MARGIN = 0.12
MIN_LEAF_COLOR_RATIO = 0.12


@lru_cache(maxsize=1)
def _load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Trained model not found at {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def _quality_check(image: np.ndarray) -> dict:
    issues: list[str] = []
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    if brightness < 40:
        issues.append("too_dark")
    if brightness > 220:
        issues.append("too_bright")
    if blur < 50:
        issues.append("too_blurry")

    # Only block extreme cases so typical phone photos still analyze
    hard_fail = brightness < 18 or brightness > 245 or blur < 8
    return {
        "ok": not hard_fail,
        "issues": issues,
        "brightness": brightness,
        "blur": blur,
    }


def _leaf_color_ratio(image: np.ndarray) -> float:
    """Share of pixels with green–yellow–brown plant-like HSV colors."""
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    # OpenCV hue 0–180: cover healthy green and diseased yellow/brown leaf tones
    plant = (
        (h >= 8)
        & (h <= 100)
        & (s >= 25)
        & (v >= 35)
        & (v <= 245)
    )
    return float(np.mean(plant))


def _reject_payload(quality: dict, issues: list[str], *, model: str = "trained_rice_model.pkl") -> dict:
    merged_issues = list(dict.fromkeys([*(quality.get("issues") or []), *issues]))
    return {
        "cropType": "",
        "disease": "",
        "severityIndex": 0,
        "probabilities": [],
        "treatmentProtocol": "",
        "quality": {
            **quality,
            "ok": False,
            "issues": merged_issues,
        },
        "model": model,
        "confidence": 0.0,
    }


def _preprocess_bgr(bgr: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    rgb = cv2.resize(rgb, IMG_SIZE, interpolation=cv2.INTER_AREA)
    rgb = cv2.GaussianBlur(rgb, (3, 3), 0)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    return rgb, hsv, gray


def _color_histogram_features(hsv: np.ndarray) -> np.ndarray:
    feats: list[float] = []
    for channel, bins, value_range in [(0, 32, [0, 180]), (1, 32, [0, 256]), (2, 32, [0, 256])]:
        hist = cv2.calcHist([hsv], [channel], None, [bins], value_range).flatten()
        hist = hist / (hist.sum() + 1e-8)
        feats.extend(hist.tolist())
    return np.asarray(feats, dtype=np.float32)


def _hog_features(gray: np.ndarray) -> np.ndarray:
    return np.asarray(hog(gray, visualize=False, feature_vector=True, **HOG_PARAMS), dtype=np.float32)


def _lbp_features(gray: np.ndarray) -> np.ndarray:
    lbp = local_binary_pattern(gray, LBP_POINTS, LBP_RADIUS, method="uniform")
    n_bins = LBP_POINTS + 2
    hist, _ = np.histogram(lbp.ravel(), bins=np.arange(0, n_bins + 1), range=(0, n_bins))
    hist = hist.astype(np.float32)
    return hist / (hist.sum() + 1e-8)


def _glcm_features(gray: np.ndarray) -> np.ndarray:
    gray_q = (gray // 8).astype(np.uint8)
    glcm = graycomatrix(
        gray_q,
        distances=GLCM_DISTANCES,
        angles=GLCM_ANGLES,
        levels=32,
        symmetric=True,
        normed=True,
    )
    features: list[float] = []
    for prop in GLCM_PROPERTIES:
        features.extend(graycoprops(glcm, prop).flatten().tolist())
    return np.asarray(features, dtype=np.float32)


def extract_feature_vector_from_bgr(bgr: np.ndarray) -> np.ndarray:
    _, hsv, gray = _preprocess_bgr(bgr)
    color = _color_histogram_features(hsv)
    hog_vec = _hog_features(gray)
    lbp_vec = _lbp_features(gray)
    glcm_vec = _glcm_features(gray)
    return np.concatenate([color, hog_vec, lbp_vec, glcm_vec]).astype(np.float32)


def _severity_from_confidence(disease: str, confidence: float, quality: dict) -> int:
    if disease == "Healthy":
        return max(0, int(8 * (1 - confidence)))
    base = int(round(confidence * 85))
    blur = float(quality.get("blur") or 80)
    # Lower blur variance (blurrier) nudges severity a bit higher
    blur_boost = 8 if blur < 80 else 0
    return int(min(95, max(12, base + blur_boost)))


def analyze_image(content: bytes, content_type: str) -> dict:
    del content_type  # mime already validated upstream
    arr = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        return _reject_payload(
            {"ok": False, "issues": [], "brightness": 0.0, "blur": 0.0},
            ["decode_failed"],
            model="unavailable",
        )

    quality = _quality_check(image)
    if not quality["ok"]:
        return _reject_payload(quality, [])

    leaf_ratio = _leaf_color_ratio(image)
    quality = {**quality, "leafColorRatio": leaf_ratio}
    if leaf_ratio < MIN_LEAF_COLOR_RATIO:
        return _reject_payload(quality, ["not_leaf_like"])

    try:
        model = _load_model()
        features = extract_feature_vector_from_bgr(image).reshape(1, -1)
        pred_id = int(model.predict(features)[0])
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(features)[0]
        else:
            proba = np.zeros(len(CLASS_NAMES), dtype=np.float64)
            proba[pred_id] = 1.0

        ranked = sorted(
            [
                {
                    "disease": APP_DISEASE_NAMES.get(CLASS_NAMES[i], CLASS_NAMES[i]),
                    "probability": float(round(float(proba[i]), 4)),
                    "rawLabel": CLASS_NAMES[i],
                }
                for i in range(len(CLASS_NAMES))
            ],
            key=lambda x: x["probability"],
            reverse=True,
        )

        top = ranked[0]
        second = ranked[1] if len(ranked) > 1 else {"probability": 0.0}
        confidence = float(top["probability"])
        margin = confidence - float(second["probability"])

        if confidence < MIN_TOP_CONFIDENCE:
            return _reject_payload(quality, ["low_confidence", "not_rice_leaf"])
        if margin < MIN_TOP_MARGIN:
            return _reject_payload(quality, ["low_confidence", "not_rice_leaf"])

        disease = top["disease"]
        severity = _severity_from_confidence(disease, confidence, quality)

        return {
            "cropType": "Rice",
            "disease": disease,
            "severityIndex": severity,
            "probabilities": [
                {"disease": r["disease"], "probability": r["probability"]} for r in ranked[:4]
            ],
            "treatmentProtocol": TREATMENT_MY.get(disease, TREATMENT_MY["Healthy"]),
            "quality": quality,
            "model": "trained_rice_model.pkl",
            "confidence": confidence,
        }
    except Exception as exc:  # noqa: BLE001 — surface graceful fallback for gateway
        return _reject_payload(
            quality,
            [f"model_error:{exc}"],
            model="error",
        )

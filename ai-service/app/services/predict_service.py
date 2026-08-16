def predict_risk(payload: dict) -> dict:
    humidity = float(payload.get("humidity") or 70)
    rainfall = float(payload.get("rainfall") or 0)

    if humidity >= 85 or rainfall >= 40:
        risk = "Outbreak_Imminent"
        confidence = 0.85
    elif humidity >= 75:
        risk = "High"
        confidence = 0.75
    elif humidity >= 60:
        risk = "Medium"
        confidence = 0.65
    else:
        risk = "Low"
        confidence = 0.6

    return {
        "riskLevel": risk,
        "forecastDays": 14,
        "confidence": confidence,
    }

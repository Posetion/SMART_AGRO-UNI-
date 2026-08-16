# Smart Agro AI Service

## Run locally

```powershell
cd d:\SMART-AGRO\ai-service
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

The Node server calls `AI_SERVICE_URL` (default `http://localhost:8000`) for `/ai/detect`.

## Rice model

- Path: `models/trained_rice_model.pkl`
- Source: sklearn SVM pipeline from `disease_predict.ipynb` (HSV + HOG + LBP + GLCM features)
- Classes: Bacterial Leaf Blight, Brown Spot, Healthy Rice Leaf, Leaf Blast, Leaf Scald, Sheath Blight

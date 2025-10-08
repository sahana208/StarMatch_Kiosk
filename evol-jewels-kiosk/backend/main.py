from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from typing import List, Optional
import random
import os

app = FastAPI(title="Evol Jewels Stylist Kiosk API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JEWELRY_DF = None
DESIGN_COL = None
LINK_COL = None

try:
    # Only use the specified hackathon database file
    FILE_CANDIDATES = [
        'Evol Jewels Hackathon Database.xlsx',               # no extra space
        'Evol Jewels Hackathon Database .xlsx'               # variant with extra space
    ]
    file_to_load = None
    for candidate in FILE_CANDIDATES:
        if os.path.exists(candidate):
            file_to_load = candidate
            break
    if file_to_load is None:
        # Explicitly require the provided Excel; do not create any fallback
        raise FileNotFoundError("Evol Jewels Hackathon Database.xlsx not found in backend directory")

    JEWELRY_DF = pd.read_excel(file_to_load)
    print(f"Loading jewelry data from: {file_to_load}")
    # Normalize/alias columns to expected names when possible
    # Build a normalized lookup for case/space variants
    norm_lookup = {c.strip().lower(): c for c in JEWELRY_DF.columns}
    alias_map = {
        'Name': ['name', 'product name', 'title', 'item name'],
        'Category': ['category', 'type', 'jewelry type', 'jewel type'],
        'Price': ['price', 'mrp', 'cost', 'amount', 'sale price'],
        'Style': ['style', 'design style'],
        'Image URL': ['image url', 'image', 'imageurl', 'image link', 'image_url', 'image url '],
        'Celebrity Inspiration': ['celebrity inspiration', 'inspired by', 'celebrity', 'inspiration']
    }
    for target, candidates in alias_map.items():
        if target not in JEWELRY_DF.columns:
            for cand in candidates:
                key = cand.strip().lower()
                if key in norm_lookup:
                    source_col = norm_lookup[key]
                    JEWELRY_DF[target] = JEWELRY_DF[source_col]
                    break

    # Detect an optional design column, if present
    for cand in ['Design', 'Jewel Design', 'Jewelry Design', 'Design Description', 'Design Name']:
        if cand in JEWELRY_DF.columns:
            DESIGN_COL = cand
            break
    # Detect an optional product link column, if present
    for cand in ['Link', 'URL', 'Product Link', 'Product URL', 'Buy Link', 'Purchase Link']:
        if cand in JEWELRY_DF.columns:
            LINK_COL = cand
            break
    
    # Ensure all required columns exist AFTER alias mapping
    required_columns = ['Name', 'Category', 'Price', 'Style', 'Image URL', 'Celebrity Inspiration']
    missing = [col for col in required_columns if col not in JEWELRY_DF.columns]
    # Auto-create sensible defaults for missing columns
    if missing:
        if 'Style' in missing:
            # Try derive from collection/collection name; else default
            style_source = None
            for k in ['collection name', 'collection', 'theme']:
                if k in norm_lookup:
                    style_source = norm_lookup[k]
                    break
            if style_source is not None:
                JEWELRY_DF['Style'] = JEWELRY_DF[style_source].fillna('General')
            else:
                JEWELRY_DF['Style'] = 'General'
            missing = [m for m in missing if m != 'Style']
        if 'Image URL' in missing:
            JEWELRY_DF['Image URL'] = ''
            missing = [m for m in missing if m != 'Image URL']
        if 'Celebrity Inspiration' in missing:
            JEWELRY_DF['Celebrity Inspiration'] = '-'
            missing = [m for m in missing if m != 'Celebrity Inspiration']
    # If still missing critical columns, raise
    missing = [col for col in required_columns if col not in JEWELRY_DF.columns]
    if missing:
        raise ValueError(f"Missing required column(s): {', '.join(missing)}")

    # Coerce Price to numeric to avoid string prices
    try:
        JEWELRY_DF['Price'] = pd.to_numeric(JEWELRY_DF['Price'], errors='coerce')
        JEWELRY_DF = JEWELRY_DF.dropna(subset=['Price'])
    except Exception:
        pass
    # Clean Image URL: replace missing/unknown with placeholder, and fallback to image-like Link
    try:
        def _is_image_url(url: str) -> bool:
            url = (url or '').lower().strip()
            return any(url.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif'])

        def _clean_img(val):
            if pd.isna(val):
                return ''
            s = str(val).strip()
            if s == '' or 'unknown' in s.lower():
                return ''
            return s

        # Normalize current image urls
        JEWELRY_DF['Image URL'] = JEWELRY_DF['Image URL'].apply(_clean_img)

        # If Image URL missing but Link looks like a direct image, use Link for image
        if LINK_COL and LINK_COL in JEWELRY_DF.columns:
            try:
                mask_missing_img = (JEWELRY_DF['Image URL'] == '')
                mask_link_is_image = JEWELRY_DF[LINK_COL].astype(str).str.lower().str.strip().apply(_is_image_url)
                use_link_mask = mask_missing_img & mask_link_is_image
                JEWELRY_DF.loc[use_link_mask, 'Image URL'] = JEWELRY_DF.loc[use_link_mask, LINK_COL]
            except Exception:
                pass

        # Finally, fill remaining missing with placeholder
        JEWELRY_DF['Image URL'] = JEWELRY_DF['Image URL'].replace('', 'https://via.placeholder.com/400x400?text=Jewelry+Image')
    except Exception:
        pass
    print("Successfully loaded jewelry data!")
except Exception as e:
    print(f"Error loading jewelry data: {str(e)}")
    # Do NOT create any fallback files or data; keep empty to surface errors on requests
    JEWELRY_DF = pd.DataFrame()

class SurveyResponse(BaseModel):
    occasion: str
    style: str
    budget: float
    category: Optional[str] = None  # earrings | necklace | ring
    vibe: Optional[str] = None      # free-form text (celebrity or vibe)

class JewelryItem(BaseModel):
    name: str
    category: str
    price: float
    style: str
    image_url: str
    celebrity_inspiration: str
    design: Optional[str] = None
    link: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Welcome to Evol Jewels Stylist Kiosk API"}

@app.post("/recommend", response_model=List[JewelryItem])
async def get_recommendations(response: SurveyResponse):
    if JEWELRY_DF is None or JEWELRY_DF.empty:
        raise HTTPException(status_code=500, detail="Jewelry database not available")
    
    df = JEWELRY_DF.copy()

    # Optional category filter if present
    if response.category:
        try:
            df = df[df['Category'].str.lower() == response.category.strip().lower()]
        except Exception:
            pass

    # Primary filters (style exact match + within budget)
    try:
        filtered = df[
            (df['Style'].astype(str).str.lower() == response.style.strip().lower()) &
            (df['Price'] <= response.budget)
        ]
    except Exception:
        filtered = df[df['Price'] <= response.budget]
    
    if filtered.empty:
        # Fallback: anything within budget
        filtered = df[df['Price'] <= response.budget]

    # Lightweight vibe mapping: map a few common vibes/celebs to style hints
    vibe = (response.vibe or '').strip().lower()
    vibe_to_styles = {
        'classic': ['traditional', 'minimal'],
        'glam': ['bold', 'modern'],
        'boho': ['modern'],
        'minimal': ['minimal'],
        'bold': ['bold'],
        'deepika': ['classic', 'traditional', 'glam'],
        'alia': ['modern', 'minimal'],
        'priyanka': ['bold', 'glam']
    }
    vibe_styles = []
    for key, styles in vibe_to_styles.items():
        if key in vibe:
            vibe_styles.extend(styles)
    vibe_styles = [s.lower() for s in vibe_styles]

    # Scoring
    def score_row(row):
        s = 0.0
        # Style exact match
        try:
            if str(row['Style']).strip().lower() == response.style.strip().lower():
                s += 2.0
        except Exception:
            pass
        # Vibe bonus
        if vibe_styles:
            try:
                if str(row['Style']).strip().lower() in vibe_styles:
                    s += 1.0
            except Exception:
                pass
        # Budget closeness (closer to budget but not exceeding)
        try:
            price = float(row['Price'])
            if price <= response.budget:
                # Normalize closeness 0..1
                s += max(0.0, 1.0 - (response.budget - price) / max(response.budget, 1))
        except Exception:
            pass
        return s

    try:
        filtered = filtered.copy()
        filtered['__score'] = filtered.apply(score_row, axis=1)
        filtered = filtered.sort_values(by='__score', ascending=False)
    except Exception:
        pass
    
    # Convert to list of dictionaries and shuffle
    top = filtered.head(20) if len(filtered) > 3 else filtered
    recommendations = top.sample(min(3, len(top))) if len(top) > 3 else top
    recommendations = recommendations.to_dict('records')
    
    # Convert to JewelryItem objects
    return [
        JewelryItem(
            name=item['Name'],
            category=item['Category'],
            price=item['Price'],
            style=item['Style'],
            image_url=item['Image URL'],
            celebrity_inspiration=item['Celebrity Inspiration'],
            design=(item.get(DESIGN_COL) if DESIGN_COL else None),
            link=(item.get(LINK_COL) if LINK_COL else None)
        ) for item in recommendations
    ]

# Text-to-speech endpoint
@app.get("/speak/{text}")
async def text_to_speech(text: str, language: str = "en"):
    # In a real implementation, this would integrate with a TTS service
    # For now, just return the text
    return {"text": text, "language": language, "status": "success"}

@app.post("/ai/refresh")
async def ai_refresh():
    # Placeholder for future scraping/NLP refresh process
    return {"status": "queued"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

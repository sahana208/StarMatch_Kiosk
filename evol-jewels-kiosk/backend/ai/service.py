from typing import Optional
import pandas as pd
from .schema import init_db, get_conn


def refresh(jewelry_df: Optional[pd.DataFrame] = None) -> dict:
    """Ingest current jewelry dataframe into SQLite for AI modules.
    This is a simple initial loader; later we will add scraping + NLP tagging.
    """
    init_db()
    if jewelry_df is None or jewelry_df.empty:
        return {"status": "no_data"}

    # Upsert simple items table (truncate and load for now)
    with get_conn() as conn:
        conn.execute("DELETE FROM items")
        conn.execute("DELETE FROM item_trends")
        rows = []
        for _, r in jewelry_df.iterrows():
            rows.append(
                (
                    str(r.get("Name", "")),
                    str(r.get("Category", "")),
                    float(r.get("Price", 0) or 0),
                    str(r.get("Style", "")),
                    str(r.get("Image URL", "")),
                    str(r.get("Link", "")),
                    str(r.get("Design", "")),
                )
            )
        conn.executemany(
            "INSERT INTO items(name, category, price, style, image_url, link, design) VALUES (?,?,?,?,?,?,?)",
            rows,
        )
        conn.commit()
    return {"status": "ok", "count": len(rows)}

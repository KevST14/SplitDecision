"""Curated category tabs, mapped to Polymarket's own (stable) Gamma tag ids.

These ids come straight from https://gamma-api.polymarket.com/tags/slug/<slug>
and match the categories Polymarket's own site navigates by, so filtering by
one of these reliably surfaces a specific, varied slice of markets instead of
whatever happens to have the most volume today (which skews toward repetitive
sports-spread and Fed-rate markets).
"""

CATEGORIES = [
    {"id": "trending", "label": "Trending", "tag_id": None},
    {"id": "politics", "label": "Politics", "tag_id": 2},
    {"id": "crypto", "label": "Crypto", "tag_id": 21},
    {"id": "culture", "label": "Culture", "tag_id": 596},
    {"id": "ai", "label": "AI", "tag_id": 439},
    {"id": "sports", "label": "Sports", "tag_id": 1},
    {"id": "business", "label": "Business", "tag_id": 107},
    {"id": "world", "label": "World", "tag_id": 101970},
]

_BY_ID = {c["id"]: c for c in CATEGORIES}


def tag_id_for(category_id: str | None) -> int | None:
    if category_id is None:
        return None
    category = _BY_ID.get(category_id)
    if category is None:
        raise ValueError(f"unknown category '{category_id}'")
    return category["tag_id"]

import json
import pandas as pd

SOURCE_JSON = "archive/games.json"
OUTPUT_CSV = "archive/games_clean_stage2.csv"


KEEP_COLUMNS = [
    "AppID",
    "Name",
    "Release date",
    "Estimated owners",
    "Peak CCU",
    "Required age",
    "Price",
    "DiscountDLC count",
    "About the game",
    "Supported languages",
    "Full audio languages",
    "Windows",
    "Mac",
    "Linux",
    "Metacritic score",
    "User score",
    "Positive",
    "Negative",
    "Achievements",
    "Average playtime forever",
    "Average playtime two weeks",
    "Median playtime forever",
    "Median playtime two weeks",
    "Developers",
    "Publishers",
    "Categories",
    "Genres",
    "Tags",
]


def as_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        return list(value.keys())
    return [str(value)]


with open(SOURCE_JSON, "r", encoding="utf-8") as f:
    data = json.load(f)

rows = []
for app_id, g in data.items():
    try:
        app_id_int = int(app_id)
    except Exception:
        continue

    row = {
        "AppID": app_id_int,
        "Name": g.get("name"),
        "Release date": g.get("release_date"),
        "Estimated owners": g.get("estimated_owners"),
        "Peak CCU": g.get("peak_ccu"),
        "Required age": g.get("required_age"),
        "Price": g.get("price"),
        "DiscountDLC count": g.get("dlc_count"),
        "About the game": g.get("about_the_game"),
        "Supported languages": as_list(g.get("supported_languages")),
        "Full audio languages": as_list(g.get("full_audio_languages")),
        "Windows": g.get("windows"),
        "Mac": g.get("mac"),
        "Linux": g.get("linux"),
        "Metacritic score": g.get("metacritic_score"),
        "User score": g.get("user_score"),
        "Positive": g.get("positive"),
        "Negative": g.get("negative"),
        "Achievements": g.get("achievements"),
        "Average playtime forever": g.get("average_playtime_forever"),
        "Average playtime two weeks": g.get("average_playtime_2weeks"),
        "Median playtime forever": g.get("median_playtime_forever"),
        "Median playtime two weeks": g.get("median_playtime_2weeks"),
        "Developers": as_list(g.get("developers")),
        "Publishers": as_list(g.get("publishers")),
        "Categories": as_list(g.get("categories")),
        "Genres": as_list(g.get("genres")),
        "Tags": as_list(g.get("tags")),
    }
    rows.append(row)

df = pd.DataFrame(rows, columns=KEEP_COLUMNS)
df.to_csv(OUTPUT_CSV, index=False)

print(f"Rebuilt CSV: {OUTPUT_CSV}")
print(f"Rows: {len(df)}")
print("Columns:", df.columns.tolist())
print("First row AppID:", df.iloc[0]["AppID"] if len(df) else None)

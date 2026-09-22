import ast
import argparse
import pandas as pd
import mysql.connector


def to_int(value):
    if pd.isna(value):
        return None
    try:
        return int(float(value))
    except Exception:
        return None


def to_float(value):
    if pd.isna(value):
        return None
    try:
        return float(value)
    except Exception:
        return None


def to_bool(value):
    if pd.isna(value):
        return None
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"true", "1", "yes"}:
        return True
    if text in {"false", "0", "no"}:
        return False
    return None


def split_values(value):
    if pd.isna(value):
        return []

    text = str(value).strip()
    if text == "" or text == "[]":
        return []

    if text.startswith("[") and text.endswith("]"):
        try:
            parsed = ast.literal_eval(text)
            if isinstance(parsed, list):
                return [str(x).strip() for x in parsed if str(x).strip()]
        except Exception:
            pass

    parts = [p.strip().strip("\"'") for p in text.split(",")]
    return [p for p in parts if p]


def validate_source_dataframe(df):
    required = ["AppID", "Name", "Release date"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(
            f"CSV missing required columns: {missing}. Rebuild with stage3/rebuild_clean_csv.py"
        )

    # AppID should be numeric for almost all rows.
    appid_numeric = pd.to_numeric(df["AppID"], errors="coerce")
    non_numeric_ratio = appid_numeric.isna().mean()
    if non_numeric_ratio > 0.05:
        raise ValueError(
            "AppID column appears invalid or shifted (too many non-numeric values). "
            "Rebuild with stage3/rebuild_clean_csv.py"
        )

    # A common shift symptom is AppID holding game names and Name holding dates.
    # If most Name values look like dates, stop and ask for rebuild.
    name_as_date_ratio = pd.to_datetime(df["Name"], errors="coerce").notna().mean()
    if name_as_date_ratio > 0.6:
        raise ValueError(
            "Detected column shift: Name column looks like dates. "
            "Rebuild with stage3/rebuild_clean_csv.py"
        )


def run_schema(cursor, schema_path):
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()

    # Newer mysql-connector versions may not support execute(..., multi=True).
    # Execute the schema file one statement at a time for compatibility.
    statements = [stmt.strip() for stmt in sql.split(";") if stmt.strip()]
    for stmt in statements:
        cursor.execute(stmt)


def insert_lookup(cursor, table_name, column_name, values):
    if not values:
        return
    sql = f"INSERT IGNORE INTO {table_name} ({column_name}) VALUES (%s)"
    cursor.executemany(sql, [(v,) for v in sorted(values)])


def fetch_lookup_map(cursor, table_name, id_col, name_col):
    cursor.execute(f"SELECT {id_col}, {name_col} FROM {table_name}")
    return {name: row_id for row_id, name in cursor.fetchall()}


def main():
    parser = argparse.ArgumentParser(description="Load Steam sample/full data into MySQL normalized schema.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=3306)
    parser.add_argument("--user", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--database", default="steam_games_db")
    parser.add_argument("--csv", default="archive/games_clean_stage2.csv")
    parser.add_argument("--schema", default="stage3/schema.sql")
    parser.add_argument("--sample-size", type=int, default=5000, help="Use 0 for full dataset")
    args = parser.parse_args()

    df = pd.read_csv(args.csv)
    validate_source_dataframe(df)

    if args.sample_size and args.sample_size > 0:
        df = df.head(args.sample_size).copy()

    conn = mysql.connector.connect(
        host=args.host,
        port=args.port,
        user=args.user,
        password=args.password,
        autocommit=False,
    )
    cursor = conn.cursor()

    try:
        run_schema(cursor, args.schema)
        cursor.execute(f"USE {args.database}")

        game_rows = []
        dev_set, pub_set, genre_set = set(), set(), set()
        cat_set, tag_set, lang_set, audio_lang_set = set(), set(), set(), set()

        for _, row in df.iterrows():
            app_id = to_int(row.get("AppID"))
            if app_id is None:
                continue

            game_rows.append((
                app_id,
                str(row.get("Name", "")).strip()[:255],
                str(row.get("Release date", "")).strip()[:64] or None,
                str(row.get("Estimated owners", "")).strip()[:32] or None,
                to_int(row.get("Peak CCU")),
                to_int(row.get("Required age")),
                to_float(row.get("Price")),
                to_int(row.get("Metacritic score")),
                to_int(row.get("User score")),
                to_int(row.get("Positive")),
                to_int(row.get("Negative")),
                to_int(row.get("Achievements")),
                to_int(row.get("Average playtime forever")),
                to_int(row.get("Average playtime two weeks")),
                to_int(row.get("Median playtime forever")),
                to_int(row.get("Median playtime two weeks")),
                to_bool(row.get("Windows")),
                to_bool(row.get("Mac")),
                to_bool(row.get("Linux")),
                str(row.get("About the game", "")).strip() or None,
                None,
                None,
            ))

            dev_set.update(split_values(row.get("Developers")))
            pub_set.update(split_values(row.get("Publishers")))
            genre_set.update(split_values(row.get("Genres")))
            cat_set.update(split_values(row.get("Categories")))
            tag_set.update(split_values(row.get("Tags")))
            lang_set.update(split_values(row.get("Supported languages")))
            audio_lang_set.update(split_values(row.get("Full audio languages")))

        cursor.executemany(
            """
            INSERT INTO game (
                app_id, name, release_date, estimated_owners, peak_ccu, required_age, price,
                metacritic_score, user_score, positive, negative, achievements,
                average_playtime_forever, average_playtime_2weeks,
                median_playtime_forever, median_playtime_2weeks,
                windows_support, mac_support, linux_support,
                about_the_game, discount_percent, dlc_count
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                release_date = VALUES(release_date),
                estimated_owners = VALUES(estimated_owners),
                peak_ccu = VALUES(peak_ccu),
                required_age = VALUES(required_age),
                price = VALUES(price),
                metacritic_score = VALUES(metacritic_score),
                user_score = VALUES(user_score),
                positive = VALUES(positive),
                negative = VALUES(negative),
                achievements = VALUES(achievements),
                average_playtime_forever = VALUES(average_playtime_forever),
                average_playtime_2weeks = VALUES(average_playtime_2weeks),
                median_playtime_forever = VALUES(median_playtime_forever),
                median_playtime_2weeks = VALUES(median_playtime_2weeks),
                windows_support = VALUES(windows_support),
                mac_support = VALUES(mac_support),
                linux_support = VALUES(linux_support),
                about_the_game = VALUES(about_the_game)
            """,
            game_rows,
        )

        insert_lookup(cursor, "developer", "developer_name", dev_set)
        insert_lookup(cursor, "publisher", "publisher_name", pub_set)
        insert_lookup(cursor, "genre", "genre_name", genre_set)
        insert_lookup(cursor, "category", "category_name", cat_set)
        insert_lookup(cursor, "tag", "tag_name", tag_set)
        insert_lookup(cursor, "language", "language_name", lang_set)
        insert_lookup(cursor, "audio_language", "audio_language_name", audio_lang_set)

        dev_map = fetch_lookup_map(cursor, "developer", "developer_id", "developer_name")
        pub_map = fetch_lookup_map(cursor, "publisher", "publisher_id", "publisher_name")
        genre_map = fetch_lookup_map(cursor, "genre", "genre_id", "genre_name")
        cat_map = fetch_lookup_map(cursor, "category", "category_id", "category_name")
        tag_map = fetch_lookup_map(cursor, "tag", "tag_id", "tag_name")
        lang_map = fetch_lookup_map(cursor, "language", "language_id", "language_name")
        audio_lang_map = fetch_lookup_map(cursor, "audio_language", "audio_language_id", "audio_language_name")

        game_dev_rows, game_pub_rows = set(), set()
        game_genre_rows, game_cat_rows = set(), set()
        game_tag_rows, game_lang_rows, game_audio_rows = set(), set(), set()

        for _, row in df.iterrows():
            app_id = to_int(row.get("AppID"))
            if app_id is None:
                continue

            for name in split_values(row.get("Developers")):
                if name in dev_map:
                    game_dev_rows.add((app_id, dev_map[name]))

            for name in split_values(row.get("Publishers")):
                if name in pub_map:
                    game_pub_rows.add((app_id, pub_map[name]))

            for name in split_values(row.get("Genres")):
                if name in genre_map:
                    game_genre_rows.add((app_id, genre_map[name]))

            for name in split_values(row.get("Categories")):
                if name in cat_map:
                    game_cat_rows.add((app_id, cat_map[name]))

            for name in split_values(row.get("Tags")):
                if name in tag_map:
                    game_tag_rows.add((app_id, tag_map[name]))

            for name in split_values(row.get("Supported languages")):
                if name in lang_map:
                    game_lang_rows.add((app_id, lang_map[name]))

            for name in split_values(row.get("Full audio languages")):
                if name in audio_lang_map:
                    game_audio_rows.add((app_id, audio_lang_map[name]))

        cursor.executemany("INSERT IGNORE INTO game_developer (app_id, developer_id) VALUES (%s, %s)", list(game_dev_rows))
        cursor.executemany("INSERT IGNORE INTO game_publisher (app_id, publisher_id) VALUES (%s, %s)", list(game_pub_rows))
        cursor.executemany("INSERT IGNORE INTO game_genre (app_id, genre_id) VALUES (%s, %s)", list(game_genre_rows))
        cursor.executemany("INSERT IGNORE INTO game_category (app_id, category_id) VALUES (%s, %s)", list(game_cat_rows))
        cursor.executemany("INSERT IGNORE INTO game_tag (app_id, tag_id) VALUES (%s, %s)", list(game_tag_rows))
        cursor.executemany("INSERT IGNORE INTO game_language (app_id, language_id) VALUES (%s, %s)", list(game_lang_rows))
        cursor.executemany("INSERT IGNORE INTO game_audio_language (app_id, audio_language_id) VALUES (%s, %s)", list(game_audio_rows))

        conn.commit()

        print("Load completed.")
        print(f"Games inserted/updated: {len(game_rows)}")
        print(f"Developers: {len(dev_set)}, Publishers: {len(pub_set)}, Genres: {len(genre_set)}")
        print(f"Categories: {len(cat_set)}, Tags: {len(tag_set)}")
        print(f"Languages: {len(lang_set)}, Audio languages: {len(audio_lang_set)}")

    except Exception as exc:
        conn.rollback()
        raise RuntimeError(f"Load failed: {exc}")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()

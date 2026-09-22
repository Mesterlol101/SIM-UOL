Stage 3 quick start

1) Create the MySQL schema
- Run the SQL in stage3/schema.sql in your lab MySQL environment.
- Keep a copy of the full script in your report as evidence of CREATE commands.

2) Load instance data (sample first)
- Install loader dependencies:
  pip install pandas mysql-connector-python

- Run sample load (5000 rows):
  python stage3/load_mysql.py --user YOUR_USER --password YOUR_PASSWORD --host YOUR_HOST --port 3306 --sample-size 5000

- Run full load (optional, larger runtime):
  python stage3/load_mysql.py --user YOUR_USER --password YOUR_PASSWORD --host YOUR_HOST --port 3306 --sample-size 0

3) Validation queries
- SELECT COUNT(*) FROM game;
- SELECT COUNT(*) FROM game_tag;
- SELECT COUNT(*) FROM tag;
- SELECT g.name, t.tag_name
  FROM game g
  JOIN game_tag gt ON g.app_id = gt.app_id
  JOIN tag t ON gt.tag_id = t.tag_id
  LIMIT 20;

4) Reflection points you can use
- What worked well: normalized M:N relationships (especially tags and genres) made queries flexible and prevented duplicate text values.
- What did not work well: raw CSV required preprocessing due malformed/combined source fields and mixed list formats.

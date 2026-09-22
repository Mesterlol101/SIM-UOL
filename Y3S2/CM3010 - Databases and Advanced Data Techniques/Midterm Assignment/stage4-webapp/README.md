Stage 4 web application

This Node.js app connects to the MySQL database from Stage 3 and presents your research questions in a simple web UI.

Run steps

1. Copy environment template:
   - On Windows PowerShell:
     Copy-Item .env.example .env

2. Update .env values with your lab credentials.

3. Start the app:
   npm start

4. Open in browser:
   http://localhost:3000

Research screens included

- Dashboard with core database counts.
- Genres sentiment query.
- Platform support vs engagement query.
- Genre-tag combinations for high-engagement games.
- Metacritic vs user-score alignment query.
- DLC count vs engagement query (with null-rate quality snapshot).
- Developer consistency query.

Suggested report screenshots

1. Home dashboard (main app screen)
2. Any two research query result pages
3. DLC query page showing the data quality snapshot

Least-privilege database account (recommended)

Use a read-only account for the web app:

CREATE USER IF NOT EXISTS 'steam_app_ro'@'%' IDENTIFIED BY 'strong_password_here';
GRANT SELECT ON steam_games_db.* TO 'steam_app_ro'@'%';
FLUSH PRIVILEGES;

Then set DB_USER and DB_PASSWORD in .env to this account.

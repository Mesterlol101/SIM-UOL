const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const pool = require("./db");

const app = express();
const PORT = Number(process.env.APP_PORT || 3000);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const researchQueries = {
  "genres-sentiment": {
    title: "Genres With Highest Average Sentiment",
    description:
      "Compares genres by average sentiment from positive and negative review counts, with a minimum sample threshold.",
    sql: `
      SELECT ge.genre_name,
      COUNT(*) AS games_count,
      AVG((g.positive - g.negative) / NULLIF(g.positive + g.negative, 0)) AS avg_sentiment,
      AVG(g.user_score) AS avg_user_score
      FROM game g
      JOIN game_genre gg ON g.app_id = gg.app_id
      JOIN genre ge ON gg.genre_id = ge.genre_id
      WHERE g.positive IS NOT NULL
      AND g.negative IS NOT NULL
      AND (g.positive + g.negative) > 0
      GROUP BY ge.genre_id, ge.genre_name
      HAVING COUNT(*) >= ?
      ORDER BY avg_sentiment DESC
      LIMIT ?;
    `,
    getParams: (req) => {
      const minGames = Number(req.query.minGames || 30);
      const limit = Number(req.query.limit || 20);
      return [minGames, limit];
    },
  },
  "genre-tag-combos": {
    title: "Most Common Genre + Tag Combinations (High Engagement)",
    description:
      "Finds common genre-tag combinations among games with strong score and playtime signals.",
    sql: `
      SELECT
        ge.genre_name,
        t.tag_name,
        COUNT(*) AS combo_count
      FROM game g
      JOIN game_genre gg ON g.app_id = gg.app_id
      JOIN genre ge ON gg.genre_id = ge.genre_id
      JOIN game_tag gt ON g.app_id = gt.app_id
      JOIN tag t ON gt.tag_id = t.tag_id
      WHERE g.average_playtime_forever >= ?
      GROUP BY ge.genre_id, ge.genre_name, t.tag_id, t.tag_name
      HAVING COUNT(*) >= ?
      ORDER BY combo_count DESC
      LIMIT ?;
    `,
    getParams: (req) => {
      const minPlaytime = Number(req.query.minPlaytime || 200);
      const minOccurrences = Number(req.query.minOccurrences || 5);
      const limit = Number(req.query.limit || 25);
      return [minPlaytime, minOccurrences, limit];
    },
  },
  "dlc-engagement": {
    title: "DLC Count vs Engagement",
    description:
      "Shows how engagement metrics vary with DLC count and highlights data sparsity for reflection.",
    sql: `
      SELECT
        g.dlc_count,
        COUNT(*) AS games_count,
        ROUND(AVG(g.user_score), 2) AS avg_user_score,
        ROUND(AVG(g.average_playtime_forever), 2) AS avg_playtime_forever
      FROM game g
      WHERE g.dlc_count IS NOT NULL
      GROUP BY g.dlc_count
      HAVING COUNT(*) >= ?
      ORDER BY g.dlc_count;
    `,
    getParams: (req) => {
      const minGames = Number(req.query.minGames || 5);
      return [minGames];
    },
  },
  "developer-consistency": {
    title: "Developers With Consistently Higher-Rated Games",
    description:
      "Identifies developers with strong average scores across multiple titles.",
    sql: `
      SELECT
        d.developer_name,
        COUNT(DISTINCT g.app_id) AS total_titles,
        ROUND(AVG(g.user_score), 2) AS avg_user_score,
        ROUND(AVG((g.positive - g.negative) / NULLIF(g.positive + g.negative, 0)), 4) AS avg_sentiment
      FROM developer d
      JOIN game_developer gd ON d.developer_id = gd.developer_id
      JOIN game g ON gd.app_id = g.app_id
      WHERE g.positive IS NOT NULL
        AND g.negative IS NOT NULL
        AND (g.positive + g.negative) > 0
      GROUP BY d.developer_id, d.developer_name
      HAVING COUNT(DISTINCT g.app_id) >= ?
      ORDER BY avg_user_score DESC, avg_sentiment DESC
      LIMIT ?;
    `,
    getParams: (req) => {
      const minTitles = Number(req.query.minTitles || 5);
      const limit = Number(req.query.limit || 25);
      return [minTitles, limit];
    },
  },
};

app.get("/", async (req, res, next) => {
  try {
    const [gameCountRows] = await pool.query("SELECT COUNT(*) AS total_games FROM game;");
    const [tagCountRows] = await pool.query("SELECT COUNT(*) AS total_tags FROM tag;");
    const [junctionRows] = await pool.query("SELECT COUNT(*) AS total_game_tags FROM game_tag;");
    const [developerRows] = await pool.query("SELECT COUNT(*) AS total_developers FROM developer;");

    res.render("index", {
      stats: {
        totalGames: gameCountRows[0]?.total_games ?? 0,
        totalTags: tagCountRows[0]?.total_tags ?? 0,
        totalGameTags: junctionRows[0]?.total_game_tags ?? 0,
        totalDevelopers: developerRows[0]?.total_developers ?? 0,
      },
      querySlugs: Object.keys(researchQueries),
      researchQueries,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/research/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const querySpec = researchQueries[slug];

    if (!querySpec) {
      return res.status(404).render("error", {
        title: "Query Not Found",
        message: "The selected research query does not exist.",
      });
    }

    const params = querySpec.getParams(req);
    const [rows, fields] = await pool.query(querySpec.sql, params);

    let extra = null;
    if (querySpec.extraSql) {
      const [extraRows] = await pool.query(querySpec.extraSql);
      extra = extraRows;
    }

    res.render("query", {
      slug,
      title: querySpec.title,
      description: querySpec.description,
      params,
      columns: fields.map((f) => f.name),
      rows,
      extra,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (error) {
    res.status(500).json({ ok: false, db: "disconnected", error: error.message });
  }
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render("error", {
    title: "Unexpected Error",
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Stage 4 app running at http://localhost:${PORT}`);
});

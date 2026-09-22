CREATE DATABASE IF NOT EXISTS steam_games_db;
USE steam_games_db;

CREATE TABLE IF NOT EXISTS game (
    app_id                   BIGINT PRIMARY KEY,
    name                     VARCHAR(255) NOT NULL,
    release_date             VARCHAR(64)      NULL,
    estimated_owners         VARCHAR(32)      NULL,
    peak_ccu                 INT              NULL,
    required_age             INT              NULL,
    price                    DECIMAL(10,2)    NULL,
    metacritic_score         SMALLINT         NULL,
    user_score               SMALLINT         NULL,
    positive                 INT              NULL,
    negative                 INT              NULL,
    achievements             INT              NULL,
    average_playtime_forever INT              NULL,
    average_playtime_2weeks  INT              NULL,
    median_playtime_forever  INT              NULL,
    median_playtime_2weeks   INT              NULL,
    windows_support          BOOLEAN          NULL,
    mac_support              BOOLEAN          NULL,
    linux_support            BOOLEAN          NULL,
    about_the_game           TEXT             NULL,
    discount_percent         INT              NULL,
    dlc_count                INT              NULL,
    INDEX idx_game_price (price),
    INDEX idx_game_user_score (user_score),
    INDEX idx_game_metacritic_score (metacritic_score)
);

CREATE TABLE IF NOT EXISTS developer (
    developer_id INT AUTO_INCREMENT PRIMARY KEY,
    developer_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS publisher (
    publisher_id INT AUTO_INCREMENT PRIMARY KEY,
    publisher_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS genre (
    genre_id INT AUTO_INCREMENT PRIMARY KEY,
    genre_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tag (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS language (
    language_id INT AUTO_INCREMENT PRIMARY KEY,
    language_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS audio_language (
    audio_language_id INT AUTO_INCREMENT PRIMARY KEY,
    audio_language_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS game_developer (
    app_id BIGINT NOT NULL,
    developer_id INT NOT NULL,
    PRIMARY KEY (app_id, developer_id),
    CONSTRAINT fk_game_developer_game FOREIGN KEY (app_id) REFERENCES game(app_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_developer_developer FOREIGN KEY (developer_id) REFERENCES developer(developer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_publisher (
    app_id BIGINT NOT NULL,
    publisher_id INT NOT NULL,
    PRIMARY KEY (app_id, publisher_id),
    CONSTRAINT fk_game_publisher_game FOREIGN KEY (app_id) REFERENCES game(app_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_publisher_publisher FOREIGN KEY (publisher_id) REFERENCES publisher(publisher_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_genre (
    app_id BIGINT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (app_id, genre_id),
    CONSTRAINT fk_game_genre_game FOREIGN KEY (app_id) REFERENCES game(app_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_genre_genre FOREIGN KEY (genre_id) REFERENCES genre(genre_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_category (
    app_id BIGINT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (app_id, category_id),
    CONSTRAINT fk_game_category_game FOREIGN KEY (app_id) REFERENCES game(app_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_category_category FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_tag (
    app_id BIGINT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (app_id, tag_id),
    CONSTRAINT fk_game_tag_game FOREIGN KEY (app_id) REFERENCES game(app_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_tag_tag FOREIGN KEY (tag_id) REFERENCES tag(tag_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_language (
    app_id BIGINT NOT NULL,
    language_id INT NOT NULL,
    PRIMARY KEY (app_id, language_id),
    CONSTRAINT fk_game_language_game FOREIGN KEY (app_id) REFERENCES game(app_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_language_language FOREIGN KEY (language_id) REFERENCES language(language_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_audio_language (
    app_id BIGINT NOT NULL,
    audio_language_id INT NOT NULL,
    PRIMARY KEY (app_id, audio_language_id),
    CONSTRAINT fk_game_audio_language_game FOREIGN KEY (app_id) REFERENCES game(app_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_audio_language_audio_language FOREIGN KEY (audio_language_id) REFERENCES audio_language(audio_language_id) ON DELETE CASCADE
);

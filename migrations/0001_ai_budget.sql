CREATE TABLE IF NOT EXISTS ai_budget (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_window INTEGER NOT NULL,
  day_count INTEGER NOT NULL CHECK (day_count >= 0),
  minute_window INTEGER NOT NULL,
  minute_count INTEGER NOT NULL CHECK (minute_count >= 0)
);

INSERT OR IGNORE INTO ai_budget (id, day_window, day_count, minute_window, minute_count)
VALUES (1, 0, 0, 0, 0);

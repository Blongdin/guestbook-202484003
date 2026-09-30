CREATE TABLE IF NOT EXISTS entries (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(20)  NOT NULL,
  message       VARCHAR(500) NOT NULL,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ
);

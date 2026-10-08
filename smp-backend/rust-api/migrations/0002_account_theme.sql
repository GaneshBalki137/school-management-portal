-- Each person's look, applied wherever they sign in. theme: 'system' follows their device's light/dark setting. accent: colour palette.
ALTER TABLE accounts
    ADD COLUMN theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
    ADD COLUMN accent TEXT NOT NULL DEFAULT 'indigo' CHECK (accent IN ('indigo', 'ocean', 'teal', 'violet', 'berry', 'sunset', 'graphite'));

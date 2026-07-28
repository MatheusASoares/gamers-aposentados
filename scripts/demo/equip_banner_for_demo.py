import os
import urllib.parse
import psycopg2

# Read DATABASE_URL from .env
env_file = ".env"
db_url = None
if os.path.exists(env_file):
    with open(env_file, "r") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                db_url = line.strip().split("=", 1)[1].strip('"\'')

if not db_url:
    print("DATABASE_URL not found!")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Update equipped_banner to 'banner-retro-arcade' for all users
    cur.execute("UPDATE users SET equipped_banner = 'banner-retro-arcade' WHERE equipped_banner IS NULL OR username = 'matheus';")
    conn.commit()
    print("Successfully equipped 'banner-retro-arcade' for user!")
    cur.close()
    conn.close()
except Exception as e:
    print("Error updating database:", e)

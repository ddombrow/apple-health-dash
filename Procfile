# mqtt:   mosquitto
ingest: cargo run -p ahealth-ingest
api:    CONFIG_PATH=./crates/ahealth-api/config.toml cargo run -p ahealth-api --bin ahealth-api
console-assets: npm run build:watch --prefix console
console: uv run python -m uvicorn console_server:app --host 0.0.0.0 --port 4000
# mqtt:    cargo run -p ahealth-mqtt

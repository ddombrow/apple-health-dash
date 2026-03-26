# mqtt:   mosquitto
ingest: cargo run -p ahealth-ingest
api:    CONFIG_PATH=./crates/ahealth-api/config.toml cargo run -p ahealth-api --bin ahealth-api
console: npm run dev --prefix console
# mqtt:    cargo run -p ahealth-mqtt

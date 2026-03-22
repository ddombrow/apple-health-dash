# apple-health-dash monorepo task runner
# https://github.com/casey/just

default:
    @just --list

# ---------------------------------------------------------------------------
# Rust workspace
# ---------------------------------------------------------------------------

build:
    cargo build --workspace

build-release:
    cargo build --workspace --release

test:
    cargo test --workspace

check:
    cargo check --workspace

clippy:
    cargo clippy --workspace -- -D warnings

fmt:
    cargo fmt --all

fmt-check:
    cargo fmt --all -- --check

# ---------------------------------------------------------------------------
# Dev (all services via Overmind)
# ---------------------------------------------------------------------------

# Start all services defined in Procfile
dev:
    overmind start

# Restart a single service, e.g: just restart ingest
restart service:
    overmind restart {{service}}

# Attach to a service's tmux pane, e.g: just connect ingest
connect service:
    overmind connect {{service}}

# ---------------------------------------------------------------------------
# ahealth-ingest (MQTT collector)
# ---------------------------------------------------------------------------

ingest:
    cargo run -p ahealth-ingest

ingest-release:
    cargo run -p ahealth-ingest --release

# ---------------------------------------------------------------------------
# Frontend (ahealth-console)
# ---------------------------------------------------------------------------

frontend-dir := "crates/ahealth-console/frontend"

frontend-install:
    npm install --prefix {{frontend-dir}}

frontend-build:
    npm run build --prefix {{frontend-dir}}

frontend-dev:
    npm run dev --prefix {{frontend-dir}}

# ---------------------------------------------------------------------------
# Combined
# ---------------------------------------------------------------------------

# Build everything: frontend first, then Rust workspace
build-all: frontend-build build

# Run all checks (CI-suitable)
ci: fmt-check clippy test

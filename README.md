# apple-health-dash

A self-hosted Apple Health analytics platform.

## Architecture

```mermaid
flowchart LR
    subgraph iOS
        AH["Apple Health App"]
    end

    subgraph Broker
        MQTT["Mosquitto\nMQTT broker\n(→ ahealth-mqtt)"]
    end

    subgraph Ingest
        ING["ahealth-ingest\nMQTT client"]
    end

    subgraph Storage
        CH[("ClickHouse")]
    end

    subgraph API
        APID["ahealth-api\nHTTP (Dropshot)"]
    end

    subgraph Console
        AXM["ahealth-console\nHTTP (Axum)"]
        FE["Frontend\n(TypeScript)"]
    end

    AH -->|"MQTT publish\nahealth/#"| MQTT
    MQTT -->|"MQTT subscribe"| ING
    ING -->|"insert rows"| CH
    CH -->|"query"| APID
    APID -->|"JSON API"| AXM
    AXM -->|"serves"| FE
```

## Projects

| Crate | Description |
|---|---|
| `ahealth-mqtt` | MQTT broker (planned replacement for Mosquitto) |
| `ahealth-ingest` | Subscribes to MQTT, writes health metrics to ClickHouse |
| `ahealth-api` | Dropshot HTTP API over ClickHouse |
| `ahealth-console` | Axum server + TypeScript dashboard frontend |

## Development

```sh
just          # list available recipes
just ingest   # run the MQTT collector
just build    # build all Rust crates
just ci       # fmt check + clippy + tests
```

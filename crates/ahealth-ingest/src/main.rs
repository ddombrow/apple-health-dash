use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

use chrono::DateTime;
use clickhouse::{Client, Row};
use rumqttc::{AsyncClient, Event, MqttOptions, Packet, QoS};
use serde::Serialize;
use serde_json::Value;
use time::OffsetDateTime;
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;

const BROKER: &str = "localhost";
const PORT: u16 = 1883;
const TOPIC: &str = "ahealth/#";
const OUTPUT_DIR: &str = "messages";

#[derive(Row, Serialize)]
struct MetricRow {
    topic: String,
    #[serde(with = "clickhouse::serde::time::datetime64::micros")]
    ingested_at: OffsetDateTime,
    metric_name: String,
    units: String,
    #[serde(with = "clickhouse::serde::time::datetime64::micros")]
    recorded_at: OffsetDateTime,
    qty: f64,
    source: String,
}

fn parse_date(s: &str) -> Option<OffsetDateTime> {
    let dt = DateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S %z").ok()?;
    OffsetDateTime::from_unix_timestamp(dt.timestamp()).ok()
}

fn us_to_offset(us: u128) -> OffsetDateTime {
    OffsetDateTime::from_unix_timestamp((us / 1_000_000) as i64)
        .unwrap_or(OffsetDateTime::UNIX_EPOCH)
}

async fn insert_metrics(client: &Client, topic: &str, ingested_at_us: u128, payload: &Value) -> usize {
    let metrics = match payload.pointer("/data/metrics") {
        Some(Value::Array(m)) => m,
        _ => return 0,
    };

    let ingested_at = us_to_offset(ingested_at_us);
    let mut rows: Vec<MetricRow> = Vec::new();

    for metric in metrics {
        let name = match metric["name"].as_str() { Some(n) => n, None => continue };
        let units = metric["units"].as_str().unwrap_or("");
        let data = match metric["data"].as_array() { Some(d) => d, None => continue };

        for point in data {
            let date = match point["date"].as_str() { Some(d) => d, None => continue };
            let qty = match point["qty"].as_f64() { Some(q) => q, None => continue };
            let recorded_at = match parse_date(date) { Some(dt) => dt, None => continue };

            rows.push(MetricRow {
                topic: topic.to_string(),
                ingested_at,
                metric_name: name.to_string(),
                units: units.to_string(),
                recorded_at,
                qty,
                source: point["source"].as_str().unwrap_or("").to_string(),
            });
        }
    }

    if rows.is_empty() {
        return 0;
    }

    let count = rows.len();
    let mut insert = match client.insert("ahealth_metrics") {
        Ok(i) => i,
        Err(e) => { error!("Insert init error: {e}"); return 0; }
    };

    for row in &rows {
        if let Err(e) = insert.write(row).await {
            error!("Write error: {e}");
            return 0;
        }
    }

    match insert.end().await {
        Ok(_) => count,
        Err(e) => { error!("Insert commit error: {e}"); 0 }
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with_target(false)
        .init();

    fs::create_dir_all(OUTPUT_DIR).expect("Failed to create output directory");

    let ch = Client::default()
        .with_url("http://localhost:8123")
        .with_database("default");

    ch.query(
        "CREATE TABLE IF NOT EXISTS ahealth_metrics (
            topic        String,
            ingested_at  DateTime64(6, 'UTC'),
            metric_name  String,
            units        String,
            recorded_at  DateTime64(6, 'UTC'),
            qty          Float64,
            source       String DEFAULT ''
        ) ENGINE = ReplacingMergeTree()
        ORDER BY (metric_name, recorded_at, source)",
    )
    .execute()
    .await
    .expect("Failed to initialize schema");

    info!("Schema ready");

    let mut mqttoptions = MqttOptions::new("ahae-collector", BROKER, PORT);
    mqttoptions.set_keep_alive(std::time::Duration::from_secs(30));
    mqttoptions.set_max_packet_size(10 * 1024 * 1024, 10 * 1024 * 1024);

    let (mqtt_client, mut eventloop) = AsyncClient::new(mqttoptions, 10);

    mqtt_client
        .subscribe(TOPIC, QoS::AtLeastOnce)
        .await
        .expect("Failed to subscribe");

    info!("Connected to {BROKER}:{PORT}, subscribed to '{TOPIC}'");
    //info!("Writing messages to ./{OUTPUT_DIR}/");

    loop {
        match eventloop.poll().await {
            Ok(Event::Incoming(Packet::ConnAck(_))) => {
                mqtt_client.subscribe(TOPIC, QoS::AtLeastOnce).await.ok();
                info!("(Re)subscribed to '{TOPIC}'");
            }
            Ok(Event::Incoming(Packet::Publish(msg))) => {
                let topic = msg.topic.clone();
                let payload_str = String::from_utf8_lossy(&msg.payload).to_string();

                let payload: Value = match serde_json::from_str(&payload_str) {
                    Ok(v) => v,
                    Err(_) => Value::String(payload_str),
                };

                let ts = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_micros();

                // let safe_topic = topic.replace('/', "_");
                // let filename = format!("{OUTPUT_DIR}/{ts}_{safe_topic}.json");
                // let data = serde_json::json!({
                //     "topic": topic,
                //     "timestamp_us": ts,
                //     "payload": payload,
                // });
                // match fs::write(&filename, serde_json::to_string_pretty(&data).unwrap()) {
                //     Ok(_) => debug!("Saved: {filename}"),
                //     Err(e) => error!("Failed to write {filename}: {e}"),
                // }

                if topic == "ahealth/metrics" {
                    let ch = ch.clone();
                    let topic_clone = topic.clone();
                    let payload_clone = payload.clone();
                    tokio::spawn(async move {
                        let inserted = insert_metrics(&ch, &topic_clone, ts, &payload_clone).await;
                        info!(inserted, "Inserted rows into ahealth_metrics");
                    });
                }
            }
            Ok(_) => {}
            Err(e) => {
                warn!("Connection error: {e}, retrying in 2s");
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
            }
        }
    }
}

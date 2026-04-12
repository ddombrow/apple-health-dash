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

#[derive(Row, Serialize)]
struct WorkoutRow {
    topic: String,
    #[serde(with = "clickhouse::serde::time::datetime64::micros")]
    ingested_at: OffsetDateTime,
    workout_id: String,
    name: String,
    location: String,
    is_indoor: bool,
    #[serde(with = "clickhouse::serde::time::datetime64::micros")]
    started_at: OffsetDateTime,
    #[serde(with = "clickhouse::serde::time::datetime64::micros")]
    ended_at: OffsetDateTime,
    duration_seconds: f64,
    distance_qty: f64,
    distance_units: String,
    speed_qty: f64,
    speed_units: String,
    elevation_up_qty: f64,
    elevation_up_units: String,
    humidity_qty: f64,
    humidity_units: String,
    intensity_qty: f64,
    intensity_units: String,
    temperature_qty: f64,
    temperature_units: String,
    active_energy_burned_qty: f64,
    active_energy_burned_units: String,
    metadata_json: String,
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

fn nested_qty(value: &Value, key: &str) -> f64 {
    value
        .get(key)
        .and_then(|field| field.get("qty"))
        .and_then(Value::as_f64)
        .unwrap_or(0.0)
}

fn nested_units(value: &Value, key: &str) -> String {
    value
        .get(key)
        .and_then(|field| field.get("units"))
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string()
}

async fn insert_workouts(
    client: &Client,
    topic: &str,
    ingested_at_us: u128,
    payload: &Value,
) -> usize {
    let workouts = match payload.pointer("/data/workouts") {
        Some(Value::Array(w)) => w,
        _ => return 0,
    };

    let ingested_at = us_to_offset(ingested_at_us);
    let mut rows: Vec<WorkoutRow> = Vec::new();

    for workout in workouts {
        let workout_id = match workout["id"].as_str() {
            Some(id) => id,
            None => continue,
        };
        let started_at = match workout["start"].as_str().and_then(parse_date) {
            Some(dt) => dt,
            None => continue,
        };
        let ended_at = match workout["end"].as_str().and_then(parse_date) {
            Some(dt) => dt,
            None => continue,
        };

        rows.push(WorkoutRow {
            topic: topic.to_string(),
            ingested_at,
            workout_id: workout_id.to_string(),
            name: workout["name"].as_str().unwrap_or("").to_string(),
            location: workout["location"].as_str().unwrap_or("").to_string(),
            is_indoor: workout["isIndoor"].as_bool().unwrap_or(false),
            started_at,
            ended_at,
            duration_seconds: workout["duration"].as_f64().unwrap_or(0.0),
            distance_qty: nested_qty(workout, "distance"),
            distance_units: nested_units(workout, "distance"),
            speed_qty: nested_qty(workout, "speed"),
            speed_units: nested_units(workout, "speed"),
            elevation_up_qty: nested_qty(workout, "elevationUp"),
            elevation_up_units: nested_units(workout, "elevationUp"),
            humidity_qty: nested_qty(workout, "humidity"),
            humidity_units: nested_units(workout, "humidity"),
            intensity_qty: nested_qty(workout, "intensity"),
            intensity_units: nested_units(workout, "intensity"),
            temperature_qty: nested_qty(workout, "temperature"),
            temperature_units: nested_units(workout, "temperature"),
            active_energy_burned_qty: nested_qty(workout, "activeEnergyBurned"),
            active_energy_burned_units: nested_units(workout, "activeEnergyBurned"),
            metadata_json: serde_json::to_string(&workout["metadata"])
                .unwrap_or_else(|_| "{}".to_string()),
        });
    }

    if rows.is_empty() {
        return 0;
    }

    let count = rows.len();
    let mut insert = match client.insert("ahealth_workouts") {
        Ok(i) => i,
        Err(e) => {
            error!("Workout insert init error: {e}");
            return 0;
        }
    };

    for row in &rows {
        if let Err(e) = insert.write(row).await {
            error!("Workout write error: {e}");
            return 0;
        }
    }

    match insert.end().await {
        Ok(_) => count,
        Err(e) => {
            error!("Workout insert commit error: {e}");
            0
        }
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

    ch.query(
        "CREATE TABLE IF NOT EXISTS ahealth_workouts (
            topic                      String,
            ingested_at                DateTime64(6, 'UTC'),
            workout_id                 String,
            name                       String,
            location                   String,
            is_indoor                  Bool,
            started_at                 DateTime64(6, 'UTC'),
            ended_at                   DateTime64(6, 'UTC'),
            duration_seconds           Float64,
            distance_qty               Float64,
            distance_units             String,
            speed_qty                  Float64,
            speed_units                String,
            elevation_up_qty           Float64,
            elevation_up_units         String,
            humidity_qty               Float64,
            humidity_units             String,
            intensity_qty              Float64,
            intensity_units            String,
            temperature_qty            Float64,
            temperature_units          String,
            active_energy_burned_qty   Float64,
            active_energy_burned_units String,
            metadata_json              String DEFAULT '{}'
        ) ENGINE = ReplacingMergeTree()
        ORDER BY (workout_id, started_at)",
    )
    .execute()
    .await
    .expect("Failed to initialize workout schema");

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

                if payload.pointer("/data/metrics").is_some() {
                    let ch = ch.clone();
                    let topic_clone = topic.clone();
                    let payload_clone = payload.clone();
                    tokio::spawn(async move {
                        let inserted = insert_metrics(&ch, &topic_clone, ts, &payload_clone).await;
                        info!(inserted, "Inserted rows into ahealth_metrics");
                    });
                }

                if payload.pointer("/data/workouts").is_some() {
                    let ch = ch.clone();
                    let topic_clone = topic.clone();
                    let payload_clone = payload.clone();
                    tokio::spawn(async move {
                        let inserted = insert_workouts(&ch, &topic_clone, ts, &payload_clone).await;
                        info!(inserted, "Inserted rows into ahealth_workouts");
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

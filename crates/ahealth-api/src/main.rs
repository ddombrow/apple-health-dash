mod config;

use clickhouse::Client;
use dropshot::{
    endpoint, ApiDescription, ConfigDropshot, ConfigLogging, ConfigLoggingLevel, HttpError,
    HttpResponseOk, HttpServerStarter, Query, RequestContext,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

struct AppContext {
    ch: Client,
}

// --- /health ---

#[derive(Serialize, JsonSchema)]
struct HealthResponse {
    status: String,
}

/// Health check endpoint.
#[endpoint {
    method = GET,
    path = "/health",
}]
async fn health_check(
    _rqctx: RequestContext<Arc<AppContext>>,
) -> Result<HttpResponseOk<HealthResponse>, HttpError> {
    Ok(HttpResponseOk(HealthResponse {
        status: "ok".to_string(),
    }))
}

// --- /mileage/daily ---

#[derive(clickhouse::Row, serde::Deserialize, Serialize, JsonSchema)]
struct DailyMileageRow {
    /// Date in YYYY-MM-DD format.
    day: String,
    miles: f64,
}

/// Returns total walking/running distance grouped by day, newest first.
#[endpoint {
    method = GET,
    path = "/mileage/daily",
}]
async fn daily_mileage(
    rqctx: RequestContext<Arc<AppContext>>,
) -> Result<HttpResponseOk<Vec<DailyMileageRow>>, HttpError> {
    let ch = &rqctx.context().ch;

    let rows = ch
        .query(
            "SELECT toString(toDate(recorded_at)) AS day, sum(qty) AS miles
             FROM ahealth_metrics FINAL
             WHERE metric_name = 'walking_running_distance'
             GROUP BY day
             ORDER BY day DESC",
        )
        .fetch_all::<DailyMileageRow>()
        .await
        .map_err(|e| HttpError::for_internal_error(e.to_string()))?;

    Ok(HttpResponseOk(rows))
}

// --- /mileage/weekly ---

#[derive(clickhouse::Row, serde::Deserialize, Serialize, JsonSchema)]
struct WeeklyMileageRow {
    /// Week start date (Monday) in YYYY-MM-DD format.
    week: String,
    miles: f64,
}

/// Returns total walking/running distance grouped by week (Monday start), newest first.
#[endpoint {
    method = GET,
    path = "/mileage/weekly",
}]
async fn weekly_mileage(
    rqctx: RequestContext<Arc<AppContext>>,
) -> Result<HttpResponseOk<Vec<WeeklyMileageRow>>, HttpError> {
    let ch = &rqctx.context().ch;

    let rows = ch
        .query(
            "SELECT toString(toStartOfWeek(recorded_at, 1)) AS week, sum(qty) AS miles
             FROM ahealth_metrics FINAL
             WHERE metric_name = 'walking_running_distance'
             GROUP BY week
             ORDER BY week DESC",
        )
        .fetch_all::<WeeklyMileageRow>()
        .await
        .map_err(|e| HttpError::for_internal_error(e.to_string()))?;

    Ok(HttpResponseOk(rows))
}

// --- /mileage/from-date ---

#[derive(Deserialize, JsonSchema)]
struct FromDateParams {
    /// Start date in YYYY-MM-DD format (inclusive).
    date: String,
}

#[derive(clickhouse::Row, serde::Deserialize, Serialize, JsonSchema)]
struct FromDateMileageResponse {
    miles: f64,
}

/// Returns total walking/running distance from a given date to now.
#[endpoint {
    method = GET,
    path = "/mileage/from-date",
}]
async fn mileage_from_date(
    rqctx: RequestContext<Arc<AppContext>>,
    query: Query<FromDateParams>,
) -> Result<HttpResponseOk<FromDateMileageResponse>, HttpError> {
    let ch = &rqctx.context().ch;
    let date = &query.into_inner().date;

    let row = ch
        .query(
            "SELECT sum(qty) AS miles
             FROM ahealth_metrics FINAL
             WHERE metric_name = 'walking_running_distance'
               AND recorded_at >= ?",
        )
        .bind(date)
        .fetch_one::<FromDateMileageResponse>()
        .await
        .map_err(|e| HttpError::for_internal_error(e.to_string()))?;

    Ok(HttpResponseOk(row))
}

// --- server setup ---

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cfg_path = std::env::var("CONFIG_PATH").unwrap_or_else(|_| "config.toml".into());
    let cfg = config::Config::load(&cfg_path)?;

    let log = ConfigLogging::StderrTerminal {
        level: ConfigLoggingLevel::Info,
    }
    .to_logger("ahealth-api")?;

    let ch = Client::default()
        .with_url(cfg.clickhouse_url())
        .with_database("default");

    let mut api = ApiDescription::new();
    api.register(health_check).unwrap();
    api.register(daily_mileage).unwrap();
    api.register(weekly_mileage).unwrap();
    api.register(mileage_from_date).unwrap();

    let mut f = std::fs::File::create(&cfg.openapi_spec_path)?;
    api.openapi("ahealth-api", semver::Version::new(0, 1, 0)).write(&mut f)?;

    let server = HttpServerStarter::new(
        &ConfigDropshot {
            bind_address: cfg.bind_address().parse()?,
            ..Default::default()
        },
        api,
        Arc::new(AppContext { ch }),
        &log,
    )
    .map_err(|e| anyhow::anyhow!("failed to start server: {}", e))?
    .start();

    server.await.map_err(|e| anyhow::anyhow!(e))
}

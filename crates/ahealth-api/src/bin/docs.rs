mod config {
    include!("../config.rs");
}

use axum::{
    Router,
    http::{HeaderMap, header},
    response::IntoResponse,
    routing::get,
};
use std::sync::Arc;

struct State {
    spec_path: String,
}

async fn redoc_html() -> impl IntoResponse {
    let html = r#"<!DOCTYPE html>
<html>
  <head>
    <title>ahealth-api docs</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>body { margin: 0; padding: 0; }</style>
  </head>
  <body>
    <redoc spec-url='/openapi.json'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>"#;
    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, "text/html".parse().unwrap());
    (headers, html)
}

async fn openapi_spec(
    axum::extract::State(state): axum::extract::State<Arc<State>>,
) -> impl IntoResponse {
    let spec = std::fs::read_to_string(&state.spec_path)
        .unwrap_or_else(|_| r#"{"error":"spec not found"}"#.to_string());
    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, "application/json".parse().unwrap());
    (headers, spec)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cfg_path = std::env::var("CONFIG_PATH").unwrap_or_else(|_| "config.toml".into());
    let cfg = config::Config::load(&cfg_path)?;

    let port: u16 = std::env::var("DOCS_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(9090);

    let state = Arc::new(State { spec_path: cfg.openapi_spec_path });

    let app = Router::new()
        .route("/", get(redoc_html))
        .route("/openapi.json", get(openapi_spec))
        .with_state(state);

    let addr = format!("127.0.0.1:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    println!("Redoc running at http://{}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}

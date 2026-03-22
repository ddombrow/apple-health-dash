use serde::Deserialize;

#[derive(Deserialize)]
pub struct Config {
    pub openapi_spec_path: String,
    pub server_bind_ip: String,
    pub server_bind_port: u16,
    pub clickhouse_host: String,
    pub clickhouse_port: u16,
}

impl Config {
    pub fn load(path: &str) -> anyhow::Result<Self> {
        let contents = std::fs::read_to_string(path)
            .map_err(|e| anyhow::anyhow!("failed to read config file '{}': {}", path, e))?;
        let config = toml::from_str(&contents)
            .map_err(|e| anyhow::anyhow!("failed to parse config file '{}': {}", path, e))?;
        Ok(config)
    }

    pub fn clickhouse_url(&self) -> String {
        format!("http://{}:{}", self.clickhouse_host, self.clickhouse_port)
    }

    pub fn bind_address(&self) -> String {
        format!("{}:{}", self.server_bind_ip, self.server_bind_port)
    }
}

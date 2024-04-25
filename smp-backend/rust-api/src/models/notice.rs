use serde::{Serialize, Deserialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Notice {
    pub notice_id: i32,
    pub title: Option<String>,
    pub content: Option<String>,
    pub publish_date: Option<String>,
    pub expiry_date: Option<String>
}
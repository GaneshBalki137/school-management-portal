use serde::{Serialize, Deserialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Notice {
    notice_id: i32,
    title: Option<String>,
    content: Option<String>,
    publish_date: Option<String>,
    expiry_date: Option<String>
}
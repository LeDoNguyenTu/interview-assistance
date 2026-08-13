#[derive(
    Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd, serde::Deserialize, serde::Serialize,
)]
#[serde(rename_all = "kebab-case")]
pub enum AudioSourceKind {
    Microphone,
    SystemOutput,
}

#[derive(Clone, Debug, Eq, PartialEq, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDevice {
    pub id: String,
    pub name: String,
    pub source: AudioSourceKind,
    pub is_default: bool,
    pub channels: u16,
    pub sample_rate: u32,
}

#[derive(Clone, Debug, Eq, PartialEq, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureConfig {
    pub session_id: String,
    pub microphone_device_id: Option<String>,
    pub output_device_id: Option<String>,
    pub target_sample_rate: u32,
    pub frame_duration_ms: u16,
}

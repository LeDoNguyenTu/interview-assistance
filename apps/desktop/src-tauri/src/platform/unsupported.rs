use super::PlatformCaptureSupport;

pub(super) fn capture_support(platform: &str) -> PlatformCaptureSupport {
    PlatformCaptureSupport::Unsupported(UnsupportedPlatform {
        permission_requested: false,
        platform: platform.to_owned(),
        reason: "Desktop audio capture is currently available on Windows only.".to_owned(),
    })
}

#[derive(Clone, Debug, Eq, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UnsupportedPlatform {
    pub platform: String,
    pub reason: String,
    pub permission_requested: bool,
}

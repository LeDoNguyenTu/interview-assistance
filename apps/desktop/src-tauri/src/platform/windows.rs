use super::PlatformCaptureSupport;

pub(super) fn capture_support() -> PlatformCaptureSupport {
    PlatformCaptureSupport::Supported {
        microphone: true,
        system_output: true,
        visible_indicator_required: true,
    }
}

mod unsupported;

#[cfg(target_os = "windows")]
mod windows;

pub use unsupported::UnsupportedPlatform;

#[derive(Clone, Debug, Eq, PartialEq, serde::Serialize)]
#[serde(tag = "status", rename_all = "kebab-case")]
pub enum PlatformCaptureSupport {
    Supported {
        microphone: bool,
        system_output: bool,
        visible_indicator_required: bool,
    },
    Unsupported(UnsupportedPlatform),
}

pub fn evaluate_platform(platform: &str) -> PlatformCaptureSupport {
    if platform == "windows" {
        #[cfg(target_os = "windows")]
        {
            return windows::capture_support();
        }

        #[cfg(not(target_os = "windows"))]
        {
            return PlatformCaptureSupport::Supported {
                microphone: true,
                system_output: true,
                visible_indicator_required: true,
            };
        }
    }

    unsupported::capture_support(platform)
}

pub fn capture_support() -> PlatformCaptureSupport {
    evaluate_platform(std::env::consts::OS)
}

#[cfg(test)]
mod platform_test {
    use super::{PlatformCaptureSupport, capture_support, evaluate_platform};

    #[test]
    fn windows_reports_visible_audio_capture_support() {
        assert!(matches!(
            evaluate_platform("windows"),
            PlatformCaptureSupport::Supported { .. }
        ));
    }

    #[test]
    fn unsupported_targets_return_a_typed_result_without_requesting_permissions() {
        let PlatformCaptureSupport::Unsupported(error) = evaluate_platform("linux") else {
            panic!("linux must be reported as unsupported in the Windows-first release");
        };

        assert_eq!(error.platform, "linux");
        assert!(!error.permission_requested);
    }

    #[test]
    fn the_current_target_uses_the_same_platform_evaluation() {
        assert_eq!(capture_support(), evaluate_platform(std::env::consts::OS));
    }
}

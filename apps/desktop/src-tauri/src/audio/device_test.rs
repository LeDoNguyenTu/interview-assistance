use super::device::{
    AudioDeviceBackend, BackendDevice, DeviceEnumerationError, enumerate_audio_devices,
};
use super::types::AudioSourceKind;

#[derive(Default)]
struct FakeBackend {
    devices: Vec<BackendDevice>,
    default_microphone: Option<String>,
    default_output: Option<String>,
    error: Option<DeviceEnumerationError>,
}

impl AudioDeviceBackend for FakeBackend {
    fn enumerate_active(&self) -> Result<Vec<BackendDevice>, DeviceEnumerationError> {
        self.error
            .clone()
            .map_or_else(|| Ok(self.devices.clone()), Err)
    }

    fn default_id(
        &self,
        source: AudioSourceKind,
    ) -> Result<Option<String>, DeviceEnumerationError> {
        Ok(match source {
            AudioSourceKind::Microphone => self.default_microphone.clone(),
            AudioSourceKind::SystemOutput => self.default_output.clone(),
        })
    }
}

fn candidate(id: &str, name: &str, source: AudioSourceKind) -> BackendDevice {
    BackendDevice {
        channels: 2,
        connected: true,
        id: id.to_owned(),
        name: name.to_owned(),
        sample_rate: 48_000,
        source,
    }
}

#[test]
fn keeps_stable_ids_and_duplicate_display_names() {
    let backend = FakeBackend {
        devices: vec![
            candidate("mic-a", "USB audio", AudioSourceKind::Microphone),
            candidate("mic-b", "USB audio", AudioSourceKind::Microphone),
        ],
        default_microphone: Some("mic-b".to_owned()),
        ..FakeBackend::default()
    };

    let devices = enumerate_audio_devices(&backend).expect("enumeration succeeds");
    assert_eq!(devices.len(), 2);
    assert!(devices.iter().any(|device| device.id == "microphone:mic-a"));
    assert!(devices.iter().any(|device| device.id == "microphone:mic-b"));
    assert_eq!(devices[0].name, devices[1].name);
    assert!(
        devices
            .iter()
            .find(|device| device.id == "microphone:mic-b")
            .expect("default microphone exists")
            .is_default
    );
}

#[test]
fn excludes_disconnected_devices_and_allows_empty_source_groups() {
    let mut disconnected = candidate(
        "old-output",
        "Disconnected display",
        AudioSourceKind::SystemOutput,
    );
    disconnected.connected = false;
    let backend = FakeBackend {
        devices: vec![disconnected],
        ..FakeBackend::default()
    };

    assert!(
        enumerate_audio_devices(&backend)
            .expect("empty device lists are valid")
            .is_empty()
    );
}

#[test]
fn propagates_permission_errors_without_backend_details() {
    let backend = FakeBackend {
        error: Some(DeviceEnumerationError::Permission),
        ..FakeBackend::default()
    };

    assert_eq!(
        enumerate_audio_devices(&backend),
        Err(DeviceEnumerationError::Permission)
    );
    assert_eq!(
        DeviceEnumerationError::Permission.to_string(),
        "Windows did not grant access to audio devices."
    );
}

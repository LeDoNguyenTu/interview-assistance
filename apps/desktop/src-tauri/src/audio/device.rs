use super::types::{AudioDevice, AudioSourceKind};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BackendDevice {
    pub id: String,
    pub name: String,
    pub source: AudioSourceKind,
    pub connected: bool,
    pub channels: u16,
    pub sample_rate: u32,
}

#[derive(Clone, Debug, Eq, PartialEq, serde::Serialize, thiserror::Error)]
#[serde(tag = "category", rename_all = "kebab-case")]
pub enum DeviceEnumerationError {
    #[error("Windows did not grant access to audio devices.")]
    Permission,
    #[error("The Windows audio service or selected device is unavailable.")]
    Unavailable,
    #[error("Audio devices could not be listed.")]
    Internal,
}

pub trait AudioDeviceBackend {
    fn enumerate_active(&self) -> Result<Vec<BackendDevice>, DeviceEnumerationError>;

    fn default_id(&self, source: AudioSourceKind)
    -> Result<Option<String>, DeviceEnumerationError>;
}

fn public_id(source: AudioSourceKind, backend_id: &str) -> String {
    let prefix = match source {
        AudioSourceKind::Microphone => "microphone",
        AudioSourceKind::SystemOutput => "system-output",
    };
    format!("{prefix}:{backend_id}")
}

pub fn enumerate_audio_devices(
    backend: &impl AudioDeviceBackend,
) -> Result<Vec<AudioDevice>, DeviceEnumerationError> {
    let default_microphone = backend.default_id(AudioSourceKind::Microphone)?;
    let default_output = backend.default_id(AudioSourceKind::SystemOutput)?;

    let mut devices = backend
        .enumerate_active()?
        .into_iter()
        .filter(|device| device.connected)
        .map(|device| {
            let is_default = match device.source {
                AudioSourceKind::Microphone => default_microphone.as_ref() == Some(&device.id),
                AudioSourceKind::SystemOutput => default_output.as_ref() == Some(&device.id),
            };
            AudioDevice {
                id: public_id(device.source, &device.id),
                name: device.name,
                source: device.source,
                is_default,
                channels: device.channels,
                sample_rate: device.sample_rate,
            }
        })
        .collect::<Vec<_>>();

    devices.sort_by(|left, right| {
        left.source
            .cmp(&right.source)
            .then_with(|| right.is_default.cmp(&left.is_default))
            .then_with(|| left.name.cmp(&right.name))
            .then_with(|| left.id.cmp(&right.id))
    });
    Ok(devices)
}

#[cfg(target_os = "windows")]
mod windows_backend {
    use cpal::traits::{DeviceTrait, HostTrait};

    use super::{
        AudioDeviceBackend, AudioSourceKind, BackendDevice, DeviceEnumerationError,
        enumerate_audio_devices,
    };
    use crate::audio::types::AudioDevice;

    pub struct WindowsAudioDeviceBackend {
        host: cpal::Host,
    }

    impl WindowsAudioDeviceBackend {
        fn new() -> Self {
            Self {
                host: cpal::default_host(),
            }
        }

        fn describe(
            device: cpal::Device,
            source: AudioSourceKind,
        ) -> Result<BackendDevice, DeviceEnumerationError> {
            let id = device.id().map_err(map_cpal_error)?.to_string();
            let name = device
                .description()
                .map_err(map_cpal_error)?
                .name()
                .to_owned();
            let config = match source {
                AudioSourceKind::Microphone => device.default_input_config(),
                AudioSourceKind::SystemOutput => device.default_output_config(),
            }
            .map_err(map_cpal_error)?;

            Ok(BackendDevice {
                id,
                name,
                source,
                connected: true,
                channels: config.channels(),
                sample_rate: config.sample_rate(),
            })
        }

        fn default_device_id(&self, source: AudioSourceKind) -> Option<String> {
            let device = match source {
                AudioSourceKind::Microphone => self.host.default_input_device(),
                AudioSourceKind::SystemOutput => self.host.default_output_device(),
            }?;
            device.id().ok().map(|id| id.to_string())
        }
    }

    impl AudioDeviceBackend for WindowsAudioDeviceBackend {
        fn enumerate_active(&self) -> Result<Vec<BackendDevice>, DeviceEnumerationError> {
            let microphones = self
                .host
                .input_devices()
                .map_err(map_cpal_error)?
                .filter_map(
                    |device| match Self::describe(device, AudioSourceKind::Microphone) {
                        Ok(device) => Some(Ok(device)),
                        Err(DeviceEnumerationError::Unavailable) => None,
                        Err(error) => Some(Err(error)),
                    },
                );
            let outputs = self
                .host
                .output_devices()
                .map_err(map_cpal_error)?
                .filter_map(
                    |device| match Self::describe(device, AudioSourceKind::SystemOutput) {
                        Ok(device) => Some(Ok(device)),
                        Err(DeviceEnumerationError::Unavailable) => None,
                        Err(error) => Some(Err(error)),
                    },
                );
            microphones.chain(outputs).collect()
        }

        fn default_id(
            &self,
            source: AudioSourceKind,
        ) -> Result<Option<String>, DeviceEnumerationError> {
            Ok(self.default_device_id(source))
        }
    }

    fn map_cpal_error(error: cpal::Error) -> DeviceEnumerationError {
        match error.kind() {
            cpal::ErrorKind::PermissionDenied => DeviceEnumerationError::Permission,
            cpal::ErrorKind::DeviceNotAvailable | cpal::ErrorKind::HostUnavailable => {
                DeviceEnumerationError::Unavailable
            }
            _ => DeviceEnumerationError::Internal,
        }
    }

    pub fn enumerate_windows_audio_devices() -> Result<Vec<AudioDevice>, DeviceEnumerationError> {
        std::thread::Builder::new()
            .name("candorlens-audio-enumeration".to_owned())
            .spawn(|| enumerate_audio_devices(&WindowsAudioDeviceBackend::new()))
            .map_err(|_| DeviceEnumerationError::Internal)?
            .join()
            .map_err(|_| DeviceEnumerationError::Internal)?
    }
}

#[cfg(target_os = "windows")]
pub use windows_backend::enumerate_windows_audio_devices;

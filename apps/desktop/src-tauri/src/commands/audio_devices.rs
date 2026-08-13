use crate::audio::{
    device::{DeviceEnumerationError, enumerate_windows_audio_devices},
    types::AudioDevice,
};

#[tauri::command]
pub fn list_audio_devices() -> Result<Vec<AudioDevice>, DeviceEnumerationError> {
    enumerate_windows_audio_devices()
}

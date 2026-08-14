pub trait MicrophoneStream {
    fn start(&self) -> Result<(), MicrophoneError>;
    fn stop(&self) -> Result<(), MicrophoneError>;
}

pub trait MicrophoneStreamBackend {
    type Stream: MicrophoneStream;

    fn open(&self, device_id: &str) -> Result<Self::Stream, MicrophoneError>;
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, serde::Serialize, thiserror::Error)]
#[serde(tag = "category", rename_all = "kebab-case")]
pub enum MicrophoneError {
    #[error("Windows did not grant microphone access.")]
    Permission,
    #[error("The selected microphone is unavailable.")]
    DeviceUnavailable,
    #[error("The selected microphone disconnected.")]
    DeviceLost,
    #[error("The selected microphone format is unsupported.")]
    Format,
    #[error("The microphone buffer could not continue safely.")]
    Buffer,
    #[error("Microphone capture encountered an unexpected error.")]
    Internal,
}

pub struct MicrophoneCapture<B: MicrophoneStreamBackend> {
    backend: B,
    stream: Option<B::Stream>,
}

impl<B: MicrophoneStreamBackend> MicrophoneCapture<B> {
    pub fn new(backend: B) -> Self {
        Self {
            backend,
            stream: None,
        }
    }

    pub fn is_running(&self) -> bool {
        self.stream.is_some()
    }

    pub fn start(&mut self, device_id: &str) -> Result<(), MicrophoneError> {
        if self.stream.is_some() {
            return Ok(());
        }

        let stream = self.backend.open(device_id)?;
        stream.start()?;
        self.stream = Some(stream);
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), MicrophoneError> {
        let Some(stream) = self.stream.take() else {
            return Ok(());
        };
        stream.stop()
    }
}

impl<B: MicrophoneStreamBackend> Drop for MicrophoneCapture<B> {
    fn drop(&mut self) {
        let _ = self.stop();
    }
}

#[cfg(target_os = "windows")]
mod cpal_backend {
    use std::{
        str::FromStr,
        sync::{
            Arc, Mutex,
            atomic::{AtomicBool, Ordering},
            mpsc::{Receiver, SyncSender, TrySendError, sync_channel},
        },
        thread::JoinHandle,
        time::Duration,
    };

    use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

    use super::{MicrophoneError, MicrophoneStream, MicrophoneStreamBackend};
    use crate::audio::sample_convert::{RawSamples, interleaved_to_mono};

    const CALLBACK_QUEUE_CAPACITY: usize = 12;

    #[derive(Debug, serde::Serialize)]
    #[serde(tag = "type", rename_all = "kebab-case")]
    pub enum MicrophoneSignal {
        Frame { samples: Vec<f32>, sample_rate: u32 },
        Overflow,
        DeviceLost,
        ConversionFailed,
    }

    #[derive(Clone, Copy)]
    enum RawFormat {
        I16,
        U16,
        I32,
        F32,
    }

    struct RawChunk {
        bytes: Vec<u8>,
        channels: u16,
        format: RawFormat,
        sample_rate: u32,
    }

    pub struct CpalMicrophoneBackend {
        output: SyncSender<MicrophoneSignal>,
    }

    impl CpalMicrophoneBackend {
        pub fn new(output: SyncSender<MicrophoneSignal>) -> Self {
            Self { output }
        }
    }

    pub struct CpalMicrophoneStream {
        stream: cpal::Stream,
        shutdown: Arc<AtomicBool>,
        worker: Mutex<Option<JoinHandle<()>>>,
    }

    impl MicrophoneStream for CpalMicrophoneStream {
        fn start(&self) -> Result<(), MicrophoneError> {
            self.stream.play().map_err(map_cpal_error)
        }

        fn stop(&self) -> Result<(), MicrophoneError> {
            self.shutdown.store(true, Ordering::Release);
            let pause_result = self.stream.pause().map_err(map_cpal_error);
            if let Some(worker) = self
                .worker
                .lock()
                .map_err(|_| MicrophoneError::Internal)?
                .take()
            {
                worker.join().map_err(|_| MicrophoneError::Internal)?;
            }
            pause_result
        }
    }

    impl Drop for CpalMicrophoneStream {
        fn drop(&mut self) {
            let _ = self.stop();
        }
    }

    impl MicrophoneStreamBackend for CpalMicrophoneBackend {
        type Stream = CpalMicrophoneStream;

        fn open(&self, device_id: &str) -> Result<Self::Stream, MicrophoneError> {
            let backend_id = device_id
                .strip_prefix("microphone:")
                .ok_or(MicrophoneError::DeviceUnavailable)?;
            let parsed_id = cpal::DeviceId::from_str(backend_id)
                .map_err(|_| MicrophoneError::DeviceUnavailable)?;
            let host = cpal::default_host();
            let device = host
                .device_by_id(&parsed_id)
                .ok_or(MicrophoneError::DeviceUnavailable)?;
            let supported = device.default_input_config().map_err(map_cpal_error)?;
            let format = raw_format(supported.sample_format())?;
            let config = supported.config();
            let channels = config.channels;
            let sample_rate = config.sample_rate;
            let (raw_sender, raw_receiver) = sync_channel(CALLBACK_QUEUE_CAPACITY);
            let error_output = self.output.clone();
            let shutdown = Arc::new(AtomicBool::new(false));
            let callback_output = self.output.clone();
            let stream = device
                .build_input_stream_raw(
                    config,
                    supported.sample_format(),
                    move |data, _| {
                        let chunk = RawChunk {
                            bytes: data.bytes().to_vec(),
                            channels,
                            format,
                            sample_rate,
                        };
                        if matches!(raw_sender.try_send(chunk), Err(TrySendError::Full(_))) {
                            let _ = callback_output.try_send(MicrophoneSignal::Overflow);
                        }
                    },
                    move |error| {
                        let signal = match error.kind() {
                            cpal::ErrorKind::DeviceNotAvailable
                            | cpal::ErrorKind::DeviceChanged
                            | cpal::ErrorKind::StreamInvalidated => MicrophoneSignal::DeviceLost,
                            _ => MicrophoneSignal::ConversionFailed,
                        };
                        let _ = error_output.try_send(signal);
                    },
                    Some(Duration::from_secs(5)),
                )
                .map_err(map_cpal_error)?;
            let output = self.output.clone();
            let worker_shutdown = Arc::clone(&shutdown);
            let worker = std::thread::Builder::new()
                .name("candorlens-microphone-conversion".to_owned())
                .spawn(move || convert_chunks(raw_receiver, output, worker_shutdown))
                .map_err(|_| MicrophoneError::Internal)?;

            Ok(CpalMicrophoneStream {
                stream,
                shutdown,
                worker: Mutex::new(Some(worker)),
            })
        }
    }

    fn raw_format(format: cpal::SampleFormat) -> Result<RawFormat, MicrophoneError> {
        match format {
            cpal::SampleFormat::I16 => Ok(RawFormat::I16),
            cpal::SampleFormat::U16 => Ok(RawFormat::U16),
            cpal::SampleFormat::I32 => Ok(RawFormat::I32),
            cpal::SampleFormat::F32 => Ok(RawFormat::F32),
            _ => Err(MicrophoneError::Format),
        }
    }

    fn convert_chunks(
        receiver: Receiver<RawChunk>,
        output: SyncSender<MicrophoneSignal>,
        shutdown: Arc<AtomicBool>,
    ) {
        while !shutdown.load(Ordering::Acquire) {
            let Ok(chunk) = receiver.recv_timeout(Duration::from_millis(50)) else {
                continue;
            };
            let converted = convert_chunk(&chunk);
            let signal = match converted {
                Ok(samples) => MicrophoneSignal::Frame {
                    samples,
                    sample_rate: chunk.sample_rate,
                },
                Err(()) => MicrophoneSignal::ConversionFailed,
            };
            let _ = output.try_send(signal);
        }
    }

    fn convert_chunk(chunk: &RawChunk) -> Result<Vec<f32>, ()> {
        match chunk.format {
            RawFormat::I16 => {
                let samples = decode_i16(&chunk.bytes)?;
                interleaved_to_mono(RawSamples::I16(&samples), chunk.channels).map_err(|_| ())
            }
            RawFormat::U16 => {
                let samples = decode_u16(&chunk.bytes)?;
                interleaved_to_mono(RawSamples::U16(&samples), chunk.channels).map_err(|_| ())
            }
            RawFormat::I32 => {
                let samples = decode_i32(&chunk.bytes)?;
                interleaved_to_mono(RawSamples::I32(&samples), chunk.channels).map_err(|_| ())
            }
            RawFormat::F32 => {
                let samples = decode_f32(&chunk.bytes)?;
                interleaved_to_mono(RawSamples::F32(&samples), chunk.channels).map_err(|_| ())
            }
        }
    }

    fn decode_i16(bytes: &[u8]) -> Result<Vec<i16>, ()> {
        decode_two_byte(bytes, i16::from_ne_bytes)
    }

    fn decode_u16(bytes: &[u8]) -> Result<Vec<u16>, ()> {
        decode_two_byte(bytes, u16::from_ne_bytes)
    }

    fn decode_i32(bytes: &[u8]) -> Result<Vec<i32>, ()> {
        decode_four_byte(bytes, i32::from_ne_bytes)
    }

    fn decode_f32(bytes: &[u8]) -> Result<Vec<f32>, ()> {
        decode_four_byte(bytes, f32::from_ne_bytes)
    }

    fn decode_two_byte<T>(bytes: &[u8], decode: fn([u8; 2]) -> T) -> Result<Vec<T>, ()> {
        if !bytes.len().is_multiple_of(2) {
            return Err(());
        }
        Ok(bytes
            .chunks_exact(2)
            .map(|chunk| decode([chunk[0], chunk[1]]))
            .collect())
    }

    fn decode_four_byte<T>(bytes: &[u8], decode: fn([u8; 4]) -> T) -> Result<Vec<T>, ()> {
        if !bytes.len().is_multiple_of(4) {
            return Err(());
        }
        Ok(bytes
            .chunks_exact(4)
            .map(|chunk| decode([chunk[0], chunk[1], chunk[2], chunk[3]]))
            .collect())
    }

    fn map_cpal_error(error: cpal::Error) -> MicrophoneError {
        match error.kind() {
            cpal::ErrorKind::PermissionDenied => MicrophoneError::Permission,
            cpal::ErrorKind::DeviceNotAvailable | cpal::ErrorKind::HostUnavailable => {
                MicrophoneError::DeviceUnavailable
            }
            cpal::ErrorKind::DeviceChanged | cpal::ErrorKind::StreamInvalidated => {
                MicrophoneError::DeviceLost
            }
            cpal::ErrorKind::UnsupportedConfig | cpal::ErrorKind::UnsupportedOperation => {
                MicrophoneError::Format
            }
            _ => MicrophoneError::Internal,
        }
    }
}

#[cfg(target_os = "windows")]
pub use cpal_backend::{CpalMicrophoneBackend, MicrophoneSignal};

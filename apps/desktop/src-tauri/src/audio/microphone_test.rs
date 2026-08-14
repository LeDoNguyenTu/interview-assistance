use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};

use super::microphone::{
    MicrophoneCapture, MicrophoneError, MicrophoneStream, MicrophoneStreamBackend,
};

struct FakeStream {
    active: Arc<AtomicBool>,
    fail_on_start: bool,
}

impl MicrophoneStream for FakeStream {
    fn start(&self) -> Result<(), MicrophoneError> {
        if self.fail_on_start {
            return Err(MicrophoneError::DeviceLost);
        }
        self.active.store(true, Ordering::SeqCst);
        Ok(())
    }

    fn stop(&self) -> Result<(), MicrophoneError> {
        self.active.store(false, Ordering::SeqCst);
        Ok(())
    }
}

struct FakeBackend {
    active: Arc<AtomicBool>,
    fail_on_start: bool,
}

impl MicrophoneStreamBackend for FakeBackend {
    type Stream = FakeStream;

    fn open(&self, device_id: &str) -> Result<Self::Stream, MicrophoneError> {
        if device_id == "disconnected" {
            return Err(MicrophoneError::DeviceUnavailable);
        }
        Ok(FakeStream {
            active: Arc::clone(&self.active),
            fail_on_start: self.fail_on_start,
        })
    }
}

#[test]
fn opens_only_the_selected_device_and_stops_idempotently() {
    let active = Arc::new(AtomicBool::new(false));
    let mut capture = MicrophoneCapture::new(FakeBackend {
        active: Arc::clone(&active),
        fail_on_start: false,
    });

    capture.start("microphone:wasapi:selected").expect("starts");
    assert!(active.load(Ordering::SeqCst));
    capture.stop().expect("first stop succeeds");
    capture.stop().expect("second stop succeeds");
    assert!(!active.load(Ordering::SeqCst));
}

#[test]
fn reports_disconnection_and_callback_start_failure() {
    let active = Arc::new(AtomicBool::new(false));
    let mut disconnected = MicrophoneCapture::new(FakeBackend {
        active: Arc::clone(&active),
        fail_on_start: false,
    });
    assert_eq!(
        disconnected.start("disconnected"),
        Err(MicrophoneError::DeviceUnavailable)
    );

    let mut callback_failure = MicrophoneCapture::new(FakeBackend {
        active,
        fail_on_start: true,
    });
    assert_eq!(
        callback_failure.start("microphone:wasapi:selected"),
        Err(MicrophoneError::DeviceLost)
    );
    assert!(!callback_failure.is_running());
}

#[test]
fn stop_while_active_releases_the_stream() {
    let active = Arc::new(AtomicBool::new(false));
    let mut capture = MicrophoneCapture::new(FakeBackend {
        active: Arc::clone(&active),
        fail_on_start: false,
    });
    capture.start("microphone:wasapi:selected").expect("starts");

    capture.stop().expect("active callback stops");
    assert!(!capture.is_running());
    assert!(!active.load(Ordering::SeqCst));
}

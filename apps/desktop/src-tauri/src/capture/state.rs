#[derive(Clone, Copy, Debug, Default, Eq, PartialEq, serde::Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CaptureState {
    #[default]
    Idle,
    Preparing,
    Ready,
    Capturing,
    Interrupted,
    Stopping,
    Failed,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CaptureEvent {
    Prepare { consent_token: Option<String> },
    Prepared,
    Start,
    DeviceLost,
    DeviceRecovered,
    Stop,
    Stopped,
    Fail { category: String },
    BufferFrame,
    DiscardBuffer,
    Shutdown,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CaptureEffect {
    PrepareDevices,
    StartWorkers,
    PauseWorkers,
    ResumeWorkers,
    StopWorkers,
    DiscardBufferedFrames { count: usize },
    ClearConsent,
}

#[derive(Clone, Debug, Eq, PartialEq, thiserror::Error)]
pub enum CaptureStateError {
    #[error("Current consent is required before capture can start.")]
    ConsentRequired,
    #[error("The capture lifecycle cannot accept this operation from {state:?}.")]
    InvalidTransition { state: CaptureState },
}

#[derive(Debug, Default)]
pub struct CaptureStateMachine {
    state: CaptureState,
    consent_token: Option<String>,
    buffered_frames: usize,
    shutdown_complete: bool,
}

impl CaptureStateMachine {
    pub fn state(&self) -> CaptureState {
        self.state
    }

    pub fn buffered_frames(&self) -> usize {
        self.buffered_frames
    }

    pub fn transition(
        &mut self,
        event: CaptureEvent,
    ) -> Result<Vec<CaptureEffect>, CaptureStateError> {
        if self.shutdown_complete && !matches!(&event, CaptureEvent::Prepare { .. }) {
            return Ok(Vec::new());
        }

        match event {
            CaptureEvent::Prepare { consent_token } => self.prepare(consent_token),
            CaptureEvent::Prepared if self.state == CaptureState::Preparing => {
                self.state = CaptureState::Ready;
                Ok(Vec::new())
            }
            CaptureEvent::Start => self.start(),
            CaptureEvent::DeviceLost if self.state == CaptureState::Capturing => {
                self.state = CaptureState::Interrupted;
                Ok(vec![CaptureEffect::PauseWorkers])
            }
            CaptureEvent::DeviceRecovered if self.state == CaptureState::Interrupted => {
                self.state = CaptureState::Capturing;
                Ok(vec![CaptureEffect::ResumeWorkers])
            }
            CaptureEvent::Stop => self.stop(),
            CaptureEvent::Stopped if self.state == CaptureState::Stopping => {
                self.state = CaptureState::Idle;
                self.consent_token = None;
                Ok(vec![CaptureEffect::ClearConsent])
            }
            CaptureEvent::Fail { .. } => {
                self.state = CaptureState::Failed;
                Ok(Vec::new())
            }
            CaptureEvent::BufferFrame => {
                self.buffered_frames = self.buffered_frames.saturating_add(1);
                Ok(Vec::new())
            }
            CaptureEvent::DiscardBuffer => {
                let count = self.discard_buffer();
                Ok(vec![CaptureEffect::DiscardBufferedFrames { count }])
            }
            CaptureEvent::Shutdown => self.shutdown(),
            _ => Err(CaptureStateError::InvalidTransition { state: self.state }),
        }
    }

    fn prepare(
        &mut self,
        consent_token: Option<String>,
    ) -> Result<Vec<CaptureEffect>, CaptureStateError> {
        if self.state != CaptureState::Idle {
            return Err(CaptureStateError::InvalidTransition { state: self.state });
        }

        let Some(consent_token) = consent_token.filter(|token| !token.trim().is_empty()) else {
            return Err(CaptureStateError::ConsentRequired);
        };

        self.consent_token = Some(consent_token);
        self.shutdown_complete = false;
        self.state = CaptureState::Preparing;
        Ok(vec![CaptureEffect::PrepareDevices])
    }

    fn start(&mut self) -> Result<Vec<CaptureEffect>, CaptureStateError> {
        if self.consent_token.is_none() {
            return Err(CaptureStateError::ConsentRequired);
        }
        if self.state == CaptureState::Capturing {
            return Ok(Vec::new());
        }
        if self.state != CaptureState::Ready {
            return Err(CaptureStateError::InvalidTransition { state: self.state });
        }

        self.state = CaptureState::Capturing;
        Ok(vec![CaptureEffect::StartWorkers])
    }

    fn stop(&mut self) -> Result<Vec<CaptureEffect>, CaptureStateError> {
        if matches!(self.state, CaptureState::Idle | CaptureState::Stopping) {
            return Ok(Vec::new());
        }

        self.state = CaptureState::Stopping;
        Ok(vec![CaptureEffect::StopWorkers])
    }

    fn shutdown(&mut self) -> Result<Vec<CaptureEffect>, CaptureStateError> {
        if self.shutdown_complete {
            return Ok(Vec::new());
        }

        let count = self.discard_buffer();
        self.state = CaptureState::Idle;
        self.consent_token = None;
        self.shutdown_complete = true;
        Ok(vec![
            CaptureEffect::StopWorkers,
            CaptureEffect::DiscardBufferedFrames { count },
            CaptureEffect::ClearConsent,
        ])
    }

    fn discard_buffer(&mut self) -> usize {
        let count = self.buffered_frames;
        self.buffered_frames = 0;
        count
    }

    #[cfg(test)]
    pub(crate) fn from_state_for_test(state: CaptureState) -> Self {
        Self {
            state,
            consent_token: Some("test-consent".to_owned()),
            ..Self::default()
        }
    }
}

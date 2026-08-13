use super::state::{
    CaptureEffect, CaptureEvent, CaptureState, CaptureStateError, CaptureStateMachine,
};

fn prepared_machine() -> CaptureStateMachine {
    let mut machine = CaptureStateMachine::default();
    machine
        .transition(CaptureEvent::Prepare {
            consent_token: Some("consent-1".to_owned()),
        })
        .expect("prepare succeeds");
    machine
        .transition(CaptureEvent::Prepared)
        .expect("devices become ready");
    machine
}

#[test]
fn prepare_requires_a_non_empty_consent_token() {
    let mut machine = CaptureStateMachine::default();

    assert_eq!(
        machine.transition(CaptureEvent::Prepare {
            consent_token: None,
        }),
        Err(CaptureStateError::ConsentRequired)
    );
    assert_eq!(machine.state(), CaptureState::Idle);

    let effects = machine
        .transition(CaptureEvent::Prepare {
            consent_token: Some("consent-1".to_owned()),
        })
        .expect("consented preparation succeeds");
    assert_eq!(machine.state(), CaptureState::Preparing);
    assert_eq!(effects, vec![CaptureEffect::PrepareDevices]);
}

#[test]
fn start_requires_readiness_and_is_idempotent_while_capturing() {
    let mut idle = CaptureStateMachine::default();
    assert_eq!(
        idle.transition(CaptureEvent::Start),
        Err(CaptureStateError::ConsentRequired)
    );

    let mut machine = prepared_machine();
    assert_eq!(
        machine.transition(CaptureEvent::Start),
        Ok(vec![CaptureEffect::StartWorkers])
    );
    assert_eq!(machine.state(), CaptureState::Capturing);
    assert_eq!(machine.transition(CaptureEvent::Start), Ok(Vec::new()));
}

#[test]
fn stop_is_safe_from_every_active_state() {
    for state in [
        CaptureState::Preparing,
        CaptureState::Ready,
        CaptureState::Capturing,
        CaptureState::Interrupted,
        CaptureState::Failed,
    ] {
        let mut machine = CaptureStateMachine::from_state_for_test(state);
        assert_eq!(
            machine.transition(CaptureEvent::Stop),
            Ok(vec![CaptureEffect::StopWorkers])
        );
        assert_eq!(machine.state(), CaptureState::Stopping);
        assert_eq!(machine.transition(CaptureEvent::Stop), Ok(Vec::new()));
        assert_eq!(
            machine.transition(CaptureEvent::Stopped),
            Ok(vec![CaptureEffect::ClearConsent])
        );
        assert_eq!(machine.state(), CaptureState::Idle);
    }
}

#[test]
fn device_loss_and_recovery_are_explicit() {
    let mut machine = prepared_machine();
    machine.transition(CaptureEvent::Start).expect("starts");

    assert_eq!(
        machine.transition(CaptureEvent::DeviceLost),
        Ok(vec![CaptureEffect::PauseWorkers])
    );
    assert_eq!(machine.state(), CaptureState::Interrupted);
    assert_eq!(
        machine.transition(CaptureEvent::DeviceRecovered),
        Ok(vec![CaptureEffect::ResumeWorkers])
    );
    assert_eq!(machine.state(), CaptureState::Capturing);
}

#[test]
fn failures_discard_and_shutdown_are_bounded_and_idempotent() {
    let mut machine = prepared_machine();
    machine.transition(CaptureEvent::Start).expect("starts");
    machine
        .transition(CaptureEvent::BufferFrame)
        .expect("buffers a frame");
    machine
        .transition(CaptureEvent::Fail {
            category: "device-lost".to_owned(),
        })
        .expect("records failure");
    assert_eq!(machine.state(), CaptureState::Failed);

    assert_eq!(
        machine.transition(CaptureEvent::DiscardBuffer),
        Ok(vec![CaptureEffect::DiscardBufferedFrames { count: 1 }])
    );
    assert_eq!(machine.buffered_frames(), 0);

    assert_eq!(
        machine.transition(CaptureEvent::Shutdown),
        Ok(vec![
            CaptureEffect::StopWorkers,
            CaptureEffect::DiscardBufferedFrames { count: 0 },
            CaptureEffect::ClearConsent,
        ])
    );
    assert_eq!(machine.state(), CaptureState::Idle);
    assert_eq!(machine.transition(CaptureEvent::Shutdown), Ok(Vec::new()));

    assert_eq!(
        machine.transition(CaptureEvent::Fail {
            category: "internal".to_owned(),
        }),
        Ok(Vec::new())
    );
    assert_eq!(machine.state(), CaptureState::Idle);
}

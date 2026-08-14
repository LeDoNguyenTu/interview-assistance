use super::sample_convert::{RawSamples, SampleConversionError, interleaved_to_mono};

fn assert_close(actual: &[f32], expected: &[f32]) {
    assert_eq!(actual.len(), expected.len());
    for (actual, expected) in actual.iter().zip(expected) {
        assert!(
            (actual - expected).abs() < 0.000_1,
            "{actual} != {expected}"
        );
    }
}

#[test]
fn converts_signed_and_unsigned_sixteen_bit_samples() {
    assert_close(
        &interleaved_to_mono(RawSamples::I16(&[-32_768, 32_767]), 1).expect("i16 converts"),
        &[-1.0, 32_767.0 / 32_768.0],
    );
    assert_close(
        &interleaved_to_mono(RawSamples::U16(&[0, 32_768, 65_535]), 1).expect("u16 converts"),
        &[-1.0, 0.0, 32_767.0 / 32_768.0],
    );
}

#[test]
fn converts_signed_thirty_two_bit_and_clipped_float_samples() {
    assert_close(
        &interleaved_to_mono(RawSamples::I32(&[i32::MIN, 0, i32::MAX]), 1).expect("i32 converts"),
        &[-1.0, 0.0, i32::MAX as f32 / 2_147_483_648.0],
    );
    assert_close(
        &interleaved_to_mono(RawSamples::F32(&[-1.4, -0.25, 1.3]), 1).expect("f32 converts"),
        &[-1.0, -0.25, 1.0],
    );
}

#[test]
fn mixes_interleaved_channels_to_mono_and_preserves_silence() {
    assert_close(
        &interleaved_to_mono(RawSamples::F32(&[1.0, -1.0, 0.5, 0.5]), 2).expect("stereo converts"),
        &[0.0, 0.5],
    );
    assert_close(
        &interleaved_to_mono(RawSamples::I16(&[0, 0, 0, 0]), 2).expect("silence converts"),
        &[0.0, 0.0],
    );
}

#[test]
fn rejects_zero_channels_and_incomplete_frames() {
    assert_eq!(
        interleaved_to_mono(RawSamples::F32(&[0.0]), 0),
        Err(SampleConversionError::InvalidChannelCount)
    );
    assert_eq!(
        interleaved_to_mono(RawSamples::I16(&[1, 2, 3]), 2),
        Err(SampleConversionError::IncompleteFrame)
    );
}

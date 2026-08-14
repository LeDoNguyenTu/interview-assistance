#[derive(Clone, Copy, Debug)]
pub enum RawSamples<'a> {
    I16(&'a [i16]),
    U16(&'a [u16]),
    I32(&'a [i32]),
    F32(&'a [f32]),
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, thiserror::Error)]
pub enum SampleConversionError {
    #[error("Audio channel count must be greater than zero.")]
    InvalidChannelCount,
    #[error("The audio buffer ended partway through a frame.")]
    IncompleteFrame,
}

impl RawSamples<'_> {
    fn len(self) -> usize {
        match self {
            Self::I16(samples) => samples.len(),
            Self::U16(samples) => samples.len(),
            Self::I32(samples) => samples.len(),
            Self::F32(samples) => samples.len(),
        }
    }

    fn normalized(self, index: usize) -> f32 {
        match self {
            Self::I16(samples) => samples[index] as f32 / 32_768.0,
            Self::U16(samples) => (samples[index] as f32 - 32_768.0) / 32_768.0,
            Self::I32(samples) => samples[index] as f32 / 2_147_483_648.0,
            Self::F32(samples) => samples[index].clamp(-1.0, 1.0),
        }
    }
}

pub fn interleaved_to_mono(
    samples: RawSamples<'_>,
    channels: u16,
) -> Result<Vec<f32>, SampleConversionError> {
    let channels = usize::from(channels);
    if channels == 0 {
        return Err(SampleConversionError::InvalidChannelCount);
    }
    if !samples.len().is_multiple_of(channels) {
        return Err(SampleConversionError::IncompleteFrame);
    }

    Ok((0..samples.len())
        .step_by(channels)
        .map(|frame_start| {
            let sum = (frame_start..frame_start + channels)
                .map(|index| samples.normalized(index))
                .sum::<f32>();
            (sum / channels as f32).clamp(-1.0, 1.0)
        })
        .collect())
}

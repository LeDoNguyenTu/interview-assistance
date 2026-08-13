const REDACTED: &str = "[REDACTED]";

struct SensitiveMarker {
    marker: &'static str,
    value_delimiters: &'static [char],
}

const TOKEN_DELIMITERS: &[char] = &[' ', '\t', '\r', '\n', '&', ',', ';'];
const COOKIE_DELIMITERS: &[char] = &['\r', '\n', ';'];

const SENSITIVE_MARKERS: &[SensitiveMarker] = &[
    SensitiveMarker {
        marker: "authorization: bearer ",
        value_delimiters: TOKEN_DELIMITERS,
    },
    SensitiveMarker {
        marker: "refresh_token=",
        value_delimiters: TOKEN_DELIMITERS,
    },
    SensitiveMarker {
        marker: "access_token=",
        value_delimiters: TOKEN_DELIMITERS,
    },
    SensitiveMarker {
        marker: "cookie: ",
        value_delimiters: COOKIE_DELIMITERS,
    },
    SensitiveMarker {
        marker: "set-cookie: ",
        value_delimiters: COOKIE_DELIMITERS,
    },
    SensitiveMarker {
        marker: "gemini_api_key=",
        value_delimiters: TOKEN_DELIMITERS,
    },
    SensitiveMarker {
        marker: "openai_api_key=",
        value_delimiters: TOKEN_DELIMITERS,
    },
    SensitiveMarker {
        marker: "api_key=",
        value_delimiters: TOKEN_DELIMITERS,
    },
];

fn redact_marker(input: String, sensitive: &SensitiveMarker) -> String {
    let mut output = input;
    let mut search_from = 0;

    loop {
        let lowercase = output.to_ascii_lowercase();
        let Some(relative_start) = lowercase[search_from..].find(sensitive.marker) else {
            return output;
        };
        let value_start = search_from + relative_start + sensitive.marker.len();
        if output[value_start..].starts_with(REDACTED) {
            search_from = value_start + REDACTED.len();
            continue;
        }

        let value_length = output[value_start..]
            .find(|character| sensitive.value_delimiters.contains(&character))
            .unwrap_or(output.len() - value_start);
        if value_length == 0 {
            search_from = value_start;
            continue;
        }

        output.replace_range(value_start..value_start + value_length, REDACTED);
        search_from = value_start + REDACTED.len();
    }
}

pub fn redact_sensitive_text(input: &str) -> String {
    SENSITIVE_MARKERS
        .iter()
        .fold(input.to_owned(), redact_marker)
}

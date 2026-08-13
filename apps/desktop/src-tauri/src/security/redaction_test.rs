use super::redaction::redact_sensitive_text;

#[test]
fn redacts_bearer_and_refresh_tokens() {
    let input = "Authorization: Bearer ey.secret.value refresh_token=refresh-secret";
    let redacted = redact_sensitive_text(input);

    assert!(!redacted.contains("ey.secret.value"));
    assert!(!redacted.contains("refresh-secret"));
    assert!(redacted.contains("[REDACTED]"));
}

#[test]
fn redacts_cookies_and_provider_credentials() {
    let input =
        "Cookie: session=private-cookie; GEMINI_API_KEY=gemini-secret OPENAI_API_KEY=openai-secret";
    let redacted = redact_sensitive_text(input);

    for secret in ["private-cookie", "gemini-secret", "openai-secret"] {
        assert!(!redacted.contains(secret));
    }
    assert_eq!(redacted.matches("[REDACTED]").count(), 3);
}

#[test]
fn leaves_safe_diagnostics_readable() {
    let input = "audio device disconnected while capture was visible";
    assert_eq!(redact_sensitive_text(input), input);
}

pub mod commands;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![commands::runtime::runtime_info])
        .run(tauri::generate_context!())
        .expect("failed to run CandorLens desktop");
}

#[cfg(test)]
mod tests {
    use super::commands::runtime::runtime_info;

    #[test]
    fn runtime_info_exposes_only_the_application_version_os_and_architecture() {
        let info = runtime_info();
        let value = serde_json::to_value(info).expect("runtime information serializes");
        let object = value.as_object().expect("runtime information is an object");

        assert_eq!(object.len(), 3);
        assert_eq!(object["appVersion"], env!("CARGO_PKG_VERSION"));
        assert_eq!(object["operatingSystem"], std::env::consts::OS);
        assert_eq!(object["architecture"], std::env::consts::ARCH);
        assert!(!object.contains_key("environment"));
    }
}

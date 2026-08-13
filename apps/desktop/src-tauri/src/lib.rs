pub mod commands;
pub mod platform;
pub mod security;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(
            |app, _arguments, _cwd| {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            },
        ))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let salt_path = app.path().app_local_data_dir()?.join("stronghold-salt");
            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;
            Ok(())
        })
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

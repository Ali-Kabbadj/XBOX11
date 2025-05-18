use flexi_logger::{Duplicate, FileSpec, Logger};
use log::info;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // enable webview debug and attach port
    std::env::set_var(
        "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
        "--remote-debugging-port=9222",
    );
    // logoer Build & start the logger
    let logger =
        Logger::try_with_str("info").unwrap_or_else(|e| panic!("Failed to parse log spec: {}", e));

    let logger = logger
        .log_to_file(
            FileSpec::default()
                .basename("xbox11")
                .suffix("log")
                .directory("logs")
                .suppress_timestamp(),
        )
        .append()
        .duplicate_to_stderr(Duplicate::Info);

    logger
        .start()
        .unwrap_or_else(|e| panic!("Failed to initialize logger: {}", e));

    info!("HELL YEAH ITS WORKING!!");

    let mut builder = tauri::Builder::default();

    // Enable devtools for debugging
    #[cfg(debug_assertions)]
    {
        builder = builder.setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        });
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_gamepad::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

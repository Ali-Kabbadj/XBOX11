use log::info;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    info!("Host app starting…");
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

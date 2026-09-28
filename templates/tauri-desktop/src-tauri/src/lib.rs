// `mobile_entry_point` is required for Android/iOS: without it the built
// .so lacks the runtime symbols and `tauri android build` fails with
// "does not include required runtime symbols". It is a no-op on desktop.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

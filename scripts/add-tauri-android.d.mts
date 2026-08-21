/** Type declarations for add-tauri-android.mjs — consumed by tsc and astro check. */
export function readTauriConfig(cwd: string): Record<string, any>;
export function patchAndroidConfig(
  config: Record<string, any>,
  minSdkVersion: number,
): { config: Record<string, any>; warning: string | null };
export function main(argv?: string[]): void;

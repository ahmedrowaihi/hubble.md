/**
 * Keeps the `dark` class on `<html>` in sync with the OS color scheme.
 *
 * The desktop theme uses a class-based Tailwind dark variant
 * (`@custom-variant dark (&:is(.dark *))` in `index.css`), so the dormant
 * `.dark { … }` token block only takes effect when `.dark` is present on an
 * ancestor. Electron sets `nativeTheme.themeSource = "system"`, which mirrors
 * the OS appearance onto the renderer's `prefers-color-scheme`, so the media
 * query is the source of truth for "is the OS in dark mode?".
 */
export function initSystemTheme(): void {
	const query = window.matchMedia("(prefers-color-scheme: dark)");
	const apply = (isDark: boolean) => {
		document.documentElement.classList.toggle("dark", isDark);
	};
	apply(query.matches);
	query.addEventListener("change", (event) => apply(event.matches));
}

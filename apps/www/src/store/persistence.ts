import type { AppState } from "./state";

type Persisted = {
	workspace?: {
		lastOpenedPaths?: Record<string, string>;
	};
};

export const STORAGE_KEY = "hubble-web-app";

function readStorage<T>(key: string): T | null {
	if (typeof localStorage === "undefined") return null;
	const raw = localStorage.getItem(key);
	if (!raw) return null;

	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export function readLastOpenedPaths(): Record<string, string> {
	const persisted = readStorage<Persisted>(STORAGE_KEY);
	const paths = persisted?.workspace?.lastOpenedPaths;
	return paths && typeof paths === "object" && !Array.isArray(paths)
		? paths
		: {};
}

export function serialize(state: AppState): Persisted {
	return {
		workspace: {
			lastOpenedPaths: state.workspace.lastOpenedPaths,
		},
	};
}

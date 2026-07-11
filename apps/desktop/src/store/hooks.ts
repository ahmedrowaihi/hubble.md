import { useStoreValue } from "@simplestack/store/react";
import { canGoBack, canGoForward } from "./history";
import { historyStore, workspacePathStore } from "./state";

// Back/forward enablement depends on two stores: the history stacks and the
// workspace that picks the active stack. Boolean selectors re-render callers
// only when enablement actually flips.
export function useHistoryNav() {
	const workspacePath = useStoreValue(workspacePathStore);
	return {
		canGoBack: useStoreValue(historyStore, (history) =>
			canGoBack(history, workspacePath),
		),
		canGoForward: useStoreValue(historyStore, (history) =>
			canGoForward(history, workspacePath),
		),
	};
}

import { NewNoteButton, Toolbar as SharedToolbar } from "@hubble.md/ui";
import { useStoreValue } from "@simplestack/store/react";
import { createNote } from "../noteActions";
import { toggleSidebar } from "../store/actions";
import {
	currentPathStore,
	sidebarOpenStore,
	workspacePathStore,
} from "../store/state";

export function Toolbar({
	scrollContainer,
}: {
	scrollContainer: HTMLDivElement | null;
}) {
	const workspacePath = useStoreValue(workspacePathStore);
	const sidebarOpen = useStoreValue(sidebarOpenStore);
	const currentPath = useStoreValue(currentPathStore);

	return (
		<SharedToolbar
			currentPath={currentPath ?? null}
			sidebarOpen={sidebarOpen}
			scrollContainer={scrollContainer}
			rootProps={{ "data-tauri-drag-region": true }}
			onToggleSidebar={toggleSidebar}
			rightSlot={
				workspacePath ? (
					<NewNoteButton onClick={() => void createNote()} />
				) : undefined
			}
		/>
	);
}

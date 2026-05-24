import { isMac } from "keymatch";
import { type HTMLAttributes, useEffect, useState } from "react";
import MingcuteAddLine from "~icons/mingcute/add-line";
import MingcuteLayoutLeftLine from "~icons/mingcute/layout-left-line";
import { Button } from "../primitives/button";

const TOOLBAR_INSET = isMac() ? 78 : 8;
const ACTIONS_BASIS = "114px";

function basename(path: string) {
	return path.split(/[\\/]/).pop() ?? path;
}

function ToolbarActions({ children }: { children?: React.ReactNode }) {
	return (
		<div className="px-2" style={{ flex: `0 100 ${ACTIONS_BASIS}` }}>
			{children}
		</div>
	);
}

export function Toolbar({
	currentPath,
	sidebarOpen,
	scrollContainer,
	platformInset = true,
	leftSlot,
	rightSlot,
	onToggleSidebar,
	rootProps,
}: {
	currentPath: string | null;
	sidebarOpen: boolean;
	scrollContainer?: HTMLDivElement | null;
	platformInset?: boolean;
	leftSlot?: React.ReactNode;
	rightSlot?: React.ReactNode;
	onToggleSidebar?: () => void;
	rootProps?: HTMLAttributes<HTMLDivElement> &
		Record<`data-${string}`, unknown>;
}) {
	const [showBorder, setShowBorder] = useState(false);

	useEffect(() => {
		if (!scrollContainer) {
			setShowBorder(false);
			return;
		}
		const update = () => setShowBorder(scrollContainer.scrollTop > 0);
		update();
		scrollContainer.addEventListener("scroll", update, { passive: true });
		return () => scrollContainer.removeEventListener("scroll", update);
	}, [scrollContainer]);

	const borderClass = sidebarOpen
		? "border-b border-border"
		: showBorder
			? "[border-block-end:1px_dashed_var(--border)]"
			: "border-transparent";

	return (
		<div
			{...rootProps}
			className={`flex h-9 items-center ${borderClass} ${rootProps?.className ?? ""}`}
		>
			<ToolbarActions>
				<div
					className="flex items-center gap-1"
					style={{ paddingInlineStart: platformInset ? TOOLBAR_INSET : 0 }}
				>
					{onToggleSidebar && (
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={onToggleSidebar}
							aria-label="Toggle sidebar"
						>
							<MingcuteLayoutLeftLine className="size-4" />
						</Button>
					)}
					{leftSlot}
				</div>
			</ToolbarActions>
			<span
				className="truncate text-center text-xs text-muted-foreground"
				style={{ flex: "1 1 auto" }}
				{...rootProps}
			>
				{currentPath ? basename(currentPath) : "\u00A0"}
			</span>
			<ToolbarActions>
				<div className="flex items-center justify-end">{rightSlot}</div>
			</ToolbarActions>
		</div>
	);
}

export function NewNoteButton({ onClick }: { onClick: () => void }) {
	return (
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={onClick}
			aria-label="New Note"
			title="New Note (⌘N)"
		>
			<MingcuteAddLine className="size-4" />
		</Button>
	);
}

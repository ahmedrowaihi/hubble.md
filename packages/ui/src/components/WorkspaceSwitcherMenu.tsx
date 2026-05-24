import { Menu } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import MingcuteCheckLine from "~icons/mingcute/check-line";
import MingcuteSelectorVerticalLine from "~icons/mingcute/selector-vertical-line";
import { cn } from "../lib/utils";

function Item({
	children,
	icon,
	selected,
	className,
	...props
}: Menu.Item.Props & { icon?: ReactNode; selected?: boolean }) {
	return (
		<Menu.Item
			{...props}
			className={cn(
				"flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-start text-[11px] text-sidebar-foreground outline-hidden select-none data-highlighted:bg-sidebar-accent",
				className,
			)}
		>
			{selected ? (
				<MingcuteCheckLine className="size-3 shrink-0 text-brand" />
			) : icon ? (
				icon
			) : (
				<span className="size-3 shrink-0" />
			)}
			{children}
		</Menu.Item>
	);
}

function Separator() {
	return <Menu.Separator className="my-1 h-px bg-border" />;
}

export function WorkspaceSwitcherMenu({
	label,
	title,
	open,
	onOpenChange,
	children,
}: {
	label: string;
	title?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children: ReactNode;
}) {
	return (
		<Menu.Root open={open} onOpenChange={onOpenChange}>
			<Menu.Trigger
				className="flex min-w-0 cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-sidebar-accent"
				title={title}
			>
				<span className="truncate text-xs font-semibold text-sidebar-foreground">
					{label}
				</span>
				<MingcuteSelectorVerticalLine className="size-5 shrink-0 text-muted-foreground" />
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner align="start" side="bottom" sideOffset={4}>
					<Menu.Popup className="z-50 w-56 origin-(--transform-origin) rounded-sm border border-border bg-popover p-1 text-[11px] text-popover-foreground shadow-panel inset-shadow-chrome outline-hidden transition-[transform,opacity] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
						{children}
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}

WorkspaceSwitcherMenu.Item = Item;
WorkspaceSwitcherMenu.Separator = Separator;

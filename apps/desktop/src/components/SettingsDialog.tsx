import { Modal } from "@sudomd/ui";
import type { ReactNode } from "react";

export function SettingsDialog({
	open,
	onOpenChange,
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
}) {
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Settings"
			className="max-w-2xl"
		>
			<div className="flex flex-col gap-4">{children}</div>
		</Modal>
	);
}

export function SettingsSection({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<h3 className="text-sm font-semibold">{title}</h3>
				{description ? (
					<p className="text-xs text-muted-foreground">{description}</p>
				) : null}
			</div>
			<div>{children}</div>
		</section>
	);
}

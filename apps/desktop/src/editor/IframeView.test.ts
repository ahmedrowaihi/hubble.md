import { beforeEach, describe, expect, it, vi } from "vitest";

const desktopApi = vi.hoisted(() => ({
	pathExists: vi.fn(),
	realPath: vi.fn(),
	resolvePath: vi.fn(),
}));

vi.mock("../desktopApi", () => ({ desktopApi }));

import { resolveHtmlAppGlob, resolveMarkdownReference } from "./IframeView";

const workspacePath = "/vault";
const htmlAppPath = "/vault/personal/sf-apartment-search/browse.html";

describe("HTML app relative file references", () => {
	beforeEach(() => {
		desktopApi.pathExists.mockReset();
		desktopApi.realPath.mockReset();
		desktopApi.resolvePath.mockReset();
		desktopApi.pathExists.mockResolvedValue(true);
		desktopApi.realPath.mockImplementation(async (path: string) => path);
		desktopApi.resolvePath.mockImplementation(async (path: string) => {
			const parts: string[] = [];
			for (const part of path.split("/")) {
				if (!part || part === ".") continue;
				if (part === "..") parts.pop();
				else parts.push(part);
			}
			return `/${parts.join("/")}`;
		});
	});

	it("resolves dot-relative paths from the HTML app folder", async () => {
		await expect(
			resolveMarkdownReference(workspacePath, htmlAppPath, "./finds.md", true),
		).resolves.toBe("personal/sf-apartment-search/finds.md");
		await expect(
			resolveMarkdownReference(
				workspacePath,
				htmlAppPath,
				"../shared.md",
				true,
			),
		).resolves.toBe("personal/shared.md");
	});

	it("keeps bare paths workspace-relative", async () => {
		await expect(
			resolveMarkdownReference(
				workspacePath,
				htmlAppPath,
				"sf-apartment-search/finds.md",
				true,
			),
		).resolves.toBe("sf-apartment-search/finds.md");
	});

	it("translates dot-relative list globs to canonical workspace globs", async () => {
		await expect(
			resolveHtmlAppGlob(workspacePath, htmlAppPath, "./*.md"),
		).resolves.toBe("personal/sf-apartment-search/*.md");
		await expect(
			resolveHtmlAppGlob(workspacePath, htmlAppPath, "../**/*.md"),
		).resolves.toBe("personal/**/*.md");
		await expect(
			resolveHtmlAppGlob(workspacePath, htmlAppPath, "**/*.md"),
		).resolves.toBe("**/*.md");
	});

	it("keeps a root HTML app's relative glob workspace-relative", async () => {
		await expect(
			resolveHtmlAppGlob(
				workspacePath,
				`${workspacePath}/file-index.html`,
				"./**/*.md",
			),
		).resolves.toBe("**/*.md");
	});

	it("rejects dot-relative paths that escape the workspace", async () => {
		await expect(
			resolveMarkdownReference(
				workspacePath,
				htmlAppPath,
				"../../../outside.md",
				true,
			),
		).rejects.toThrow("must stay inside the workspace");
		await expect(
			resolveHtmlAppGlob(workspacePath, htmlAppPath, "../../../*.md"),
		).rejects.toThrow("must stay inside the workspace");
	});

	it("rejects paths whose real target escapes through a symlink", async () => {
		desktopApi.realPath.mockImplementation(async (path: string) =>
			path.endsWith("/finds.md") ? "/outside/finds.md" : path,
		);
		await expect(
			resolveMarkdownReference(workspacePath, htmlAppPath, "./finds.md", true),
		).rejects.toThrow("must stay inside the workspace");
	});
});

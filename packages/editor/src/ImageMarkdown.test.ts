import { describe, expect, it } from "vitest";
import { markdownToTiptapDoc } from "./markdownToProsemirror";
import { tiptapDocToMarkdown } from "./prosemirrorToMarkdown";

describe("image markdown conversion", () => {
	it("parses markdown image into image node", () => {
		const doc = markdownToTiptapDoc("![diagram](example.assets/abc123.png)");
		const image = doc.content?.[0];
		expect(image?.type).toBe("image");
		expect(image?.attrs).toEqual({
			src: "example.assets/abc123.png",
			alt: "diagram",
			title: undefined,
		});
	});

	it("serializes image node back to markdown image syntax", () => {
		const markdown = tiptapDocToMarkdown({
			type: "doc",
			content: [
				{
					type: "image",
					attrs: {
						src: "example.assets/abc123.png",
						alt: "diagram",
					},
				},
			],
		});
		expect(markdown).toBe("![diagram](example.assets/abc123.png)");
	});

	it("ignores markdown images with empty URLs", () => {
		const doc = markdownToTiptapDoc("before\n\n![]()\n\nafter");
		expect(doc.content?.some((node) => node.type === "image")).toBe(false);
	});

	it("keeps text that follows an inline image", () => {
		const doc = markdownToTiptapDoc("![diagram](example.png) trailing");

		expect(doc.content?.[0]).toMatchObject({
			type: "paragraph",
			content: [
				{ type: "text", text: "diagram" },
				{ type: "text", text: " trailing" },
			],
		});
	});
});

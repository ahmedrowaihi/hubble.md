import { describe, expect, it, vi } from "vitest";
import { singleFlight, writeQueue } from "./concurrency";

describe("singleFlight", () => {
	it("coalesces calls made during a run into one follow-up run", async () => {
		const resolvers: Array<() => void> = [];
		const flush = singleFlight(
			() =>
				new Promise<void>((resolve) => {
					resolvers.push(resolve);
				}),
		);

		const first = flush();
		const second = flush();
		const third = flush();
		expect(resolvers).toHaveLength(1);

		resolvers[0]?.();
		await first;
		await vi.waitFor(() => expect(resolvers).toHaveLength(2));

		resolvers[1]?.();
		await Promise.all([second, third]);
		expect(resolvers).toHaveLength(2);
	});

	it("starts a fresh run after the previous one settles", async () => {
		let runs = 0;
		const flush = singleFlight(async () => {
			runs += 1;
		});
		await flush();
		await flush();
		expect(runs).toBe(2);
	});
});

describe("writeQueue", () => {
	it("runs tasks in order and keeps going after a failure", async () => {
		const enqueue = writeQueue();
		const order: string[] = [];

		const first = enqueue(async () => {
			order.push("first");
			throw new Error("disk full");
		});
		const second = enqueue(async () => {
			order.push("second");
		});

		await expect(first).rejects.toThrow("disk full");
		await second;
		expect(order).toEqual(["first", "second"]);
	});
});

/**
 * Wraps an async function so only one run is in flight at a time. Calls made
 * during a run share a single follow-up run after it settles, so every
 * caller's promise resolves once work has observed state at least as new as
 * when it called.
 *
 * ```ts
 * const flush = singleFlight(() => sendPending());
 * void flush(); // starts a run
 * void flush(); // queues one follow-up run
 * void flush(); // shares that same follow-up run
 * ```
 */
export function singleFlight(run: () => Promise<void>): () => Promise<void> {
	let current: Promise<void> | null = null;
	let next: Promise<void> | null = null;

	const invoke = (): Promise<void> => {
		if (!current) {
			current = run().finally(() => {
				current = null;
			});
			return current;
		}
		next ??= current
			.catch(() => {})
			.then(() => {
				next = null;
				return invoke();
			});
		return next;
	};
	return invoke;
}

/**
 * An ordered async task queue: each task starts only after the previous one
 * settles, and a failed task never blocks the ones queued behind it. For
 * last-write-wins persistence, capture the payload before enqueueing so a
 * task writes the state from when it was queued.
 */
export function writeQueue() {
	let tail: Promise<void> = Promise.resolve();
	return (task: () => Promise<void>): Promise<void> => {
		tail = tail.catch(() => {}).then(task);
		return tail;
	};
}

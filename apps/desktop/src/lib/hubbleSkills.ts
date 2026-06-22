import { z } from "zod/v4";
import { desktopApi } from "../desktopApi";

/** Every Hubble skill shares this source, regardless of skill name or version. */
const HUBBLE_SKILLS_SOURCE = "bholmesdev/hubble-skills";

const skillsLockSchema = z.object({
	skills: z.record(z.string(), z.object({ source: z.string() })).optional(),
});

/**
 * Checks whether the Hubble skills are installed in a folder by reading its
 * skills-lock.json. Matches on the shared source rather than skill names so it
 * keeps working as skills are added or renamed.
 */
export async function hasHubbleSkillsInstalled(
	workspacePath: string,
): Promise<boolean> {
	const lockPath = `${workspacePath.replace(/\/+$/, "")}/skills-lock.json`;

	try {
		// Probe first so a missing lockfile (the common case) does not log a
		// noisy ENOENT from the main process read handler.
		if (!(await desktopApi.pathExists(lockPath))) return false;

		const raw = await desktopApi.readFileText(lockPath);
		const lock = skillsLockSchema.safeParse(JSON.parse(raw));
		if (!lock.success) return false;

		return Object.values(lock.data.skills ?? {}).some((skill) =>
			skill.source.startsWith(HUBBLE_SKILLS_SOURCE),
		);
	} catch {
		return false;
	}
}

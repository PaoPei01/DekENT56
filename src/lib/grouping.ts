import { getMajorCode } from './major';
import { groupKey, mainGroups, subgroups } from './groups';
import type { GroupAssignment, GroupStats, MainGroup, Profile, Subgroup } from './types';

export type AssignmentInput = Pick<Profile, 'id' | 'major' | 'admission_round' | 'gender'>;
export type AssignmentDraft = Pick<GroupAssignment, 'profile_id' | 'main_group' | 'subgroup' | 'notes'>;

const subgroupCapacity = 75;
const majorWeight = 3.2;
const admissionWeight = 2.4;
const sizeWeight = 5;

function allBuckets() {
  return mainGroups.flatMap((mainGroup, mainIndex) => {
    const orderedSubgroups = mainIndex % 2 === 0 ? subgroups : [...subgroups].reverse();
    return orderedSubgroups.map((subgroup) => ({ main_group: mainGroup, subgroup, key: groupKey(mainGroup, subgroup) }));
  });
}

function emptyStats(): GroupStats[] {
  return mainGroups.flatMap((main_group) =>
    subgroups.map((subgroup) => ({
      key: groupKey(main_group, subgroup),
      main_group,
      subgroup,
      count: 0,
      capacity: subgroupCapacity,
      majorCounts: {},
      admissionCounts: {},
      genderCounts: {},
      warnings: [],
    })),
  );
}

function increment(stats: GroupStats, profile: AssignmentInput) {
  const major = getMajorCode(profile.major) || 'Unknown';
  const admission = profile.admission_round || 'Unknown';
  const gender = profile.gender || 'Unknown';
  stats.count += 1;
  stats.majorCounts[major] = (stats.majorCounts[major] ?? 0) + 1;
  stats.admissionCounts[admission] = (stats.admissionCounts[admission] ?? 0) + 1;
  stats.genderCounts[gender] = (stats.genderCounts[gender] ?? 0) + 1;
}

export function calculateGroupStats(profiles: AssignmentInput[], assignments: Pick<GroupAssignment, 'profile_id' | 'main_group' | 'subgroup'>[]): GroupStats[] {
  const stats = emptyStats();
  const byProfile = new Map(profiles.map((profile) => [profile.id, profile]));

  for (const assignment of assignments) {
    const profile = byProfile.get(assignment.profile_id);
    const target = stats.find((item) => item.main_group === assignment.main_group && item.subgroup === assignment.subgroup);
    if (profile && target) increment(target, profile);
  }

  for (const item of stats) {
    const majorMax = Math.max(0, ...Object.values(item.majorCounts));
    const admissionMax = Math.max(0, ...Object.values(item.admissionCounts));
    if (item.count > subgroupCapacity + 8) item.warnings.push('ขนาดกลุ่มเกินเป้าหมายมาก');
    if (item.count < subgroupCapacity - 8 && profiles.length >= subgroupCapacity * 10) item.warnings.push('ขนาดกลุ่มต่ำกว่าเป้าหมาย');
    if (item.count > 0 && majorMax / item.count > 0.42) item.warnings.push('สาขาใดสาขาหนึ่งกระจุกตัวสูง');
    if (item.count > 0 && admissionMax / item.count > 0.55) item.warnings.push('รอบการรับเข้ากระจุกตัวสูง');
  }

  return stats;
}

export function autoAssignGroups(profiles: AssignmentInput[], existingAssignments: Pick<GroupAssignment, 'profile_id' | 'main_group' | 'subgroup' | 'locked'>[] = []): AssignmentDraft[] {
  const locked = existingAssignments.filter((assignment) => assignment.locked);
  const lockedIds = new Set(locked.map((assignment) => assignment.profile_id));
  const sortable = profiles
    .filter((profile) => !lockedIds.has(profile.id))
    .sort((a, b) => `${getMajorCode(a.major)}-${a.admission_round ?? ''}-${a.id}`.localeCompare(`${getMajorCode(b.major)}-${b.admission_round ?? ''}-${b.id}`));

  const buckets = allBuckets();
  const drafts: AssignmentDraft[] = locked.map((assignment) => ({
    profile_id: assignment.profile_id,
    main_group: assignment.main_group,
    subgroup: assignment.subgroup,
    notes: 'locked',
  }));
  const stats = calculateGroupStats(profiles, drafts);

  sortable.forEach((profile, index) => {
    const orderedBuckets = index % 2 === 0 ? buckets : [...buckets].reverse();
    let best = orderedBuckets[0];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const bucket of orderedBuckets) {
      const bucketStats = stats.find((item) => item.key === bucket.key);
      if (!bucketStats) continue;
      const major = getMajorCode(profile.major) || 'Unknown';
      const admission = profile.admission_round || 'Unknown';
      const score =
        bucketStats.count * sizeWeight +
        (bucketStats.majorCounts[major] ?? 0) * majorWeight +
        (bucketStats.admissionCounts[admission] ?? 0) * admissionWeight;

      if (score < bestScore) {
        best = bucket;
        bestScore = score;
      }
    }

    drafts.push({ profile_id: profile.id, main_group: best.main_group, subgroup: best.subgroup, notes: 'auto-balanced' });
    const target = stats.find((item) => item.key === best.key);
    if (target) increment(target, profile);
  });

  return drafts;
}

export function rebalanceGroups(profiles: AssignmentInput[], assignments: Pick<GroupAssignment, 'profile_id' | 'main_group' | 'subgroup' | 'locked'>[]) {
  return autoAssignGroups(profiles, assignments);
}

export function lockGroupAssignments(assignments: GroupAssignment[], userId: string, lockedAt = new Date().toISOString()): GroupAssignment[] {
  return assignments.map((assignment) => ({
    ...assignment,
    locked: true,
    locked_by: userId,
    locked_at: lockedAt,
  }));
}

export function groupLabel(mainGroup?: MainGroup | null, subgroup?: Subgroup | null, language: 'th' | 'en' = 'th') {
  if (!mainGroup || !subgroup) return language === 'th' ? 'ยังไม่จัดกลุ่ม' : 'Not assigned';
  const labels: Record<MainGroup, string> = {
    Red: language === 'th' ? 'สีแดง' : 'Red',
    Blue: language === 'th' ? 'สีน้ำเงิน' : 'Blue',
    Yellow: language === 'th' ? 'สีเหลือง' : 'Yellow',
    Green: language === 'th' ? 'สีเขียว' : 'Green',
    Pink: language === 'th' ? 'สีชมพู' : 'Pink',
    Purple: language === 'th' ? 'สีม่วง' : 'Purple',
    Orange: language === 'th' ? 'สีส้ม' : 'Orange',
  };
  return `${labels[mainGroup]} · Group ${subgroup}`;
}

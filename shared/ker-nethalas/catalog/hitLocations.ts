export const KN_HIT_LOCATION_TABLE_KEYS = ['arachnid', 'wingedBiped', 'insectoid', 'humanoid', 'quadruped', 'serpentoid'] as const

export type KnHitLocationTableKey = (typeof KN_HIT_LOCATION_TABLE_KEYS)[number]

// Chaque table se lit au D20 : [premier jet, dernier jet, localisation].
export const KN_HIT_LOCATION_TABLES = {
  arachnid: [
    [1, 2, 'rightRearLeg'],
    [3, 4, 'leftRearLeg'],
    [5, 6, 'midRightLeg'],
    [7, 8, 'midLeftLeg'],
    [9, 10, 'foreRightLeg'],
    [11, 12, 'foreLeftLeg'],
    [13, 14, 'abdomen'],
    [15, 16, 'frontRightLeg'],
    [17, 18, 'frontLeftLeg'],
    [19, 20, 'cephalothorax'],
  ],
  wingedBiped: [
    [1, 1, 'rightLeg'],
    [2, 2, 'leftLeg'],
    [3, 3, 'abdomen'],
    [4, 4, 'chest'],
    [5, 9, 'rightWing'],
    [10, 13, 'leftWing'],
    [14, 14, 'rightArm'],
    [15, 15, 'leftArm'],
    [16, 20, 'head'],
  ],
  insectoid: [
    [1, 1, 'rightRearLeg'],
    [2, 2, 'leftRearLeg'],
    [3, 3, 'rightMiddleLeg'],
    [4, 4, 'leftMiddleLeg'],
    [5, 9, 'abdomen'],
    [10, 13, 'thorax'],
    [14, 14, 'rightFrontLeg'],
    [15, 15, 'leftFrontLeg'],
    [16, 20, 'head'],
  ],
  humanoid: [
    [1, 3, 'rightLeg'],
    [4, 6, 'leftLeg'],
    [7, 9, 'abdomen'],
    [10, 12, 'chest'],
    [13, 15, 'leftArm'],
    [16, 18, 'rightArm'],
    [19, 20, 'head'],
  ],
  quadruped: [
    [1, 3, 'rightHindLeg'],
    [4, 6, 'leftHindLeg'],
    [7, 9, 'hindquarters'],
    [10, 12, 'forequarters'],
    [13, 15, 'rightFrontLeg'],
    [16, 18, 'leftFrontLeg'],
    [19, 20, 'head'],
  ],
  serpentoid: [
    [1, 17, 'body'],
    [18, 20, 'head'],
  ],
} as const satisfies Record<KnHitLocationTableKey, readonly (readonly [number, number, string])[]>

type KnTableRows = (typeof KN_HIT_LOCATION_TABLES)[KnHitLocationTableKey][number]

export type KnHitLocationKey = KnTableRows[2]

export const KN_HIT_LOCATION_KEYS = [...new Set(
  Object.values(KN_HIT_LOCATION_TABLES).flatMap(rows => rows.map(row => row[2])),
)] as [KnHitLocationKey, ...KnHitLocationKey[]]

export const KN_HIT_LOCATION_DIE = 20

export function knHitLocation(table: KnHitLocationTableKey, roll: number): KnHitLocationKey {
  const row = (KN_HIT_LOCATION_TABLES[table] as readonly KnTableRows[]).find(([from, to]) => roll >= from && roll <= to)
  if (!row) throw new RangeError(`Jet hors de la table : ${roll}`)
  return row[2]
}

export const knHitLocationsOf = (table: KnHitLocationTableKey): KnHitLocationKey[] =>
  [...new Set((KN_HIT_LOCATION_TABLES[table] as readonly KnTableRows[]).map(row => row[2]))]

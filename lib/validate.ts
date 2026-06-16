// 로또 번호 공통 검증.

/** 본번호 6개: 1~45 정수, 중복 없음. 위반 시 예외. */
export function assertSixNumbers(nums: number[]): void {
  if (!Array.isArray(nums) || nums.length !== 6)
    throw new Error("번호는 6개여야 합니다");
  for (const n of nums) {
    if (!Number.isInteger(n) || n < 1 || n > 45)
      throw new Error(`번호 범위 오류: ${n} (1~45)`);
  }
  if (new Set(nums).size !== 6) throw new Error("중복된 번호가 있습니다");
}

/** 보너스 포함 검증: 보너스도 1~45, 본번호와 겹치면 안 됨. */
export function assertWithBonus(nums: number[], bonus: number): void {
  assertSixNumbers(nums);
  if (!Number.isInteger(bonus) || bonus < 1 || bonus > 45)
    throw new Error(`보너스 범위 오류: ${bonus} (1~45)`);
  if (nums.includes(bonus)) throw new Error("보너스가 본번호와 겹칩니다");
}

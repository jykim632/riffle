import { customAlphabet } from 'nanoid'

// 시즌/주차 ID (8자, 충돌 확률 0.0000007%)
export const seasonId = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  8
)

export const weekId = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  8
)

// 범용 nanoid (12자, 요약본/멤버 등)
export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12
)

// 초대 코드 (8자, 대문자+숫자만 - 가독성)
export const inviteCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)

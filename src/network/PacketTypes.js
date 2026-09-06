/**
 * 網路封包常數定義
 */
export const PACKET_TYPES = {
  // 客端 ➔ 房主 (Unreliable 60Hz)
  INPUT: 1,

  // 客端 ➔ 房主 (Reliable)
  SHOOT_REQ: 2,
  RELOAD_REQ: 3,
  SWITCH_WEAPON: 4,

  // 房主 ➔ 客端 (Unreliable 60Hz)
  SNAPSHOT: 10,

  // 房主 ➔ 客端 (Reliable)
  HIT_EVENT: 11,
  KILL_EVENT: 12,
  ROUND_STATE: 13,
  PLAYER_JOIN: 14,
  PLAYER_LEAVE: 15
};

export const PLAYER_STATES = {
  IDLE: 0,
  RUNNING: 1,
  JUMPING: 2,
  CROUCHING: 3,
  DEAD: 4
};

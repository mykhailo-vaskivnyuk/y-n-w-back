import {
  ITableMembers, ITableNodes,
  ITableUsersMembers, OuterJoin,
} from '../../../local/imports';

export const USER_STATUS_MAP = {
  'NOT_LOGGEDIN': 0,
  'NOT_CONFIRMED': 1,
  'LOGGEDIN': 2,
  'INVITING': 3,
  'INSIDE_NET': 4,
  'DEV': Infinity,
};
export type UserStatusKeys = keyof typeof USER_STATUS_MAP;
export type PartialUserStatusKeys = Extract<UserStatusKeys,
  'NOT_LOGGEDIN' | 'NOT_CONFIRMED'
>;
export type PartialUserNetStatusKeys = Extract<UserStatusKeys,
  'INVITING'
>;
export const loggedInState = USER_STATUS_MAP.LOGGEDIN;

export type IUserNetDataResponse =
  Pick<ITableNodes, 'node_id' | 'parent_node_id'> &
  Pick<ITableMembers, 'confirmed'> &
  OuterJoin<Pick<ITableUsersMembers, 'vote'>> &
  { vote_count: number };
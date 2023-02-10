/* eslint-disable max-lines */
import { TQuery } from '../../types/types';
import { IMember, INodeWithUser } from '../../types/member.types';
import { ITableNetsData } from '../../types/db.tables.types';
import { userInNetAndItsSubnets } from '../../utils';
import { IQueriesMemberData } from './data';
import { IQueriesMemberInvite } from './invite';
import { IQueriesMemberFind } from './find';

export interface IQueriesMember {
  remove: TQuery<[
    ['user_id', number],
    ['net_id', number | null],
  ]>;
  findInTree: TQuery<[
    ['user_node_id', number],
    ['member_node_id', number],
  ], INodeWithUser>;
  findInCircle: TQuery<[
    ['parent_node_id', number | null],
    ['member_node_id', number],
  ], INodeWithUser>;
  get: TQuery<[
    ['node_id', number],
  ], IMember & Pick<ITableNetsData, 'name'>>;
  getConnected: TQuery<[
    ['parent_node_id', number],
  ], {
    user_id: number;
    node_id: number;
  }>;
  moveToTmp: TQuery<[
    ['node_id', number],
    ['parent_node_id', number],
  ]>;
  removeVoted: TQuery<[
    ['node_id', number],
    ['parent_node_id', number],
  ]>;
  change: TQuery<[
    ['node_id', number],
    ['parent_node_id', number],
    ['user_id', number],
    ['parent_user_id', number | null],
    ['net_id', number],
  ]>;
  moveFromTmp: TQuery<[
    ['node_id', number],
    ['parent_node_id', number],
  ]>;
  removeFromTmp: TQuery<[
    ['node_id', number],
    ['parent_node_id', number],
  ]>;
  data: IQueriesMemberData;
  invite: IQueriesMemberInvite;
  find: IQueriesMemberFind;
}

export const remove = `
  DELETE FROM members
  WHERE user_id = $1 AND net_id IN (
    SELECT members.net_id
    FROM members
    INNER JOIN nets ON
      nets.net_id = members.net_id
    WHERE ${userInNetAndItsSubnets()}
  )
`;

export const findInTree = `
  SELECT
    nodes_invites.*,
    nodes.*,
    members.user_id, members.confirmed
  FROM nodes
  LEFT JOIN members ON
    members.node_id = nodes.node_id
  LEFT JOIN nodes_invites ON
    nodes_invites.node_id = nodes.node_id
  WHERE nodes.parent_node_id = $1 AND nodes.node_id = $2
`;

export const findInCircle = `
  SELECT
    nodes_invites.*,
    nodes.*,
    members.user_id, members.confirmed
  FROM nodes
  LEFT JOIN members ON
    members.node_id = nodes.node_id
  LEFT JOIN nodes_invites ON
    nodes_invites.node_id = nodes.node_id
  WHERE
    nodes.node_id = $2 AND (
      nodes.parent_node_id = $1 OR
      nodes.node_id = $1
    )
`;

export const get = `
  SELECT
    nodes.*,
    members.user_id::int,
    members.confirmed,
    nets_data.name
  FROM nodes
  INNER JOIN members ON
    members.node_id = nodes.node_id
  INNER JOIN nets_data ON
    members.net_id = nets_data.net_id
  WHERE nodes.node_id = $1
`;

export const getConnected = `
  SELECT
    members.user_id
  FROM nodes
  INNER JOIN members ON
    members.node_id = nodes.node_id
  WHERE
    nodes.parent_node_id = $1 AND
    members.confirmed = false
`;

export const moveToTmp = `
  INSERT INTO members_tmp
  SELECT * FROM members
  WHERE node_id IN ($1, $2)
`;

export const removeVoted = `
  DELETE FROM members
  WHERE node_id IN ($1, $2)
`;

export const change = `
  UPDATE members_tmp
  SET
    node_id = CASE WHEN user_id = $3 THEN +$2 ELSE +$1 END
  WHERE user_id IN ($3, $4) AND net_id = $5
`;

export const moveFromTmp = `
  INSERT INTO members 
  SELECT * FROM members_tmp
  WHERE node_id IN ($1, $2)
`;

export const removeFromTmp = `
  DELETE FROM members_tmp
  WHERE node_id IN ($1, $2)
`;

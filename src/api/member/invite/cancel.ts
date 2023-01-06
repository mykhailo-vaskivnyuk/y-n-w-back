import Joi from 'joi';
import { IMemberConfirmParams } from '../../../client/common/api/types/types';
import { THandler } from '../../../router/types';
import { MemberConfirmParamsSchema } from '../../schema/schema';
import { getMemberStatus } from '../../utils/member.utils';
import { findUserNet } from '../../utils/net.utils';

const cancel: THandler<IMemberConfirmParams, boolean> = async (
  { session }, { net_node_id, node_id }
) => {
  const user_id = session.read('user_id')!;
  const [net] = await findUserNet(user_id, net_node_id);
  const [member] = await execQuery.member.findInTree([net.node_id, node_id]);
  if (!member) return false; // bad request
  const memberStatus = getMemberStatus(member);
  if (memberStatus !== 'INVITED') return false; // bad request
  await execQuery.member.inviteRemove([node_id]);
  return true;
};
cancel.paramsSchema = MemberConfirmParamsSchema;
cancel.responseSchema = Joi.boolean();

export = cancel;
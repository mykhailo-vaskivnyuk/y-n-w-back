/* eslint-disable import/no-cycle */
import { ITableEvents } from '../../../local/imports';
import { MessageTypeKeys } from './messages.types';
import { NetViewKeys } from './net.types';

export const NET_EVENT_MAP = {
  LEAVE: 'leave',
  LEAVE_CONNECTED: 'leave_connected',
  REFUSE: 'refuse',
  DISLIKE: 'dislike',
  VOTE: 'vote',
  LEAVE_VOTE: 'leave_vote',
  LEAVE_DISVOTE: 'leave_disvote',
  CONNECT_VOTE: 'connect_vote',
  CONNECT_DISVOTE: 'connect_disvote',
  UNACTIVE_DISCONNECT: 'unactive_disconnect',
  NOT_VOTE_DISCONNECT: 'not_vote_disconnect',
  BOARD_MESSAGE: 'board_message',
};
export type NetEventKeys = keyof typeof NET_EVENT_MAP;

export type IEvent =
  Omit<ITableEvents, 'net_view' | 'event_type'> & {
    net_view: NetViewKeys;
    event_type: NetEventKeys;
  };
export type IEventRecord = Omit<IEvent,
  | 'event_id'
  | 'event_type'
  | 'net_id'
  | 'date'
>;
export type IEvents = IEvent[];

export type IEventMessage = {
  type: Extract<MessageTypeKeys, 'EVENT'>;
} & IEvent;

export interface INewEventsMessage {
  type: Extract<MessageTypeKeys, 'NEW_EVENTS'>;
}

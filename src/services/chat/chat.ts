/* eslint-disable max-lines */
import * as T from '../../client/common/server/types/types';
import { IChatIdMapValue } from './types';
import { IMemberNode } from '../../db/types/member.types';
import {
  MAX_CHAT_INDEX,
  MAX_CHAT_MESSAGE_COUNT,
  MAX_CHAT_MESSAGE_INDEX,
} from '../../constants/constants';

export class ChatService {
  private messages = new Map<number, T.IChatMessage[]>();
  private counter = 0;
  private connectionChats = new Map<number, Set<number>>();
  private chatConnections = new Map<number, Set<number>>();
  private userChatIds = new Map<number, number>();
  private connectionUsers = new Map<number, number>();
  private netChatIds = new Map<number, number>();
  private nodeChatIds = new Map<number, number>();
  private getChatIdMap = {
    net: this.getNetChatId.bind(this),
    tree: this.getTreeChatId.bind(this),
    circle: this.getCircleChatId.bind(this),
  };
  private chatIdUserNetNode = new Map<number, IChatIdMapValue>();

  private genChatId() {
    this.counter = (this.counter % MAX_CHAT_INDEX) + 1;
    return this.counter;
  }

  getChatIdOfUser(user_id: number, connectionId?: number) {
    let chatId = this.userChatIds.get(user_id);
    if (!connectionId) return chatId;
    if (!chatId) {
      chatId = this.genChatId();
      logger.debug('USER', user_id, 'NEW USER CHAT', chatId);
      this.userChatIds.set(user_id, chatId);
      this.connectionUsers.set(connectionId, user_id);
      this.chatIdUserNetNode.set(chatId, { user_id });
    }
    this.addChatAndConnection(chatId, connectionId);
    return chatId;
  }

  getUserByConnectionId(connectionId: number) {
    return this.connectionUsers.get(connectionId);
  }

  getChatIdsOfNet(
    memberNode: IMemberNode,
    connectionId?: number,
  ) {
    const { net_id } = memberNode;
    const netChatIds: T.IChatConnectAll[number] = { net_id };
    for (const netView of T.NET_VIEW_MAP) {
      const chatId = this.getChatIdMap[netView](memberNode);
      if (!chatId) continue;
      netChatIds[netView] = chatId;
      connectionId && this.addChatAndConnection(chatId, connectionId);
    }
    return netChatIds;
  }

  private getNetChatId({ net_id }: IMemberNode) {
    let chatId = this.netChatIds.get(net_id);
    if (chatId) return chatId;
    chatId = this.genChatId();
    this.netChatIds.set(net_id, chatId);
    this.chatIdUserNetNode.set(chatId, { net_id });
    return chatId;
  }

  private getNodeChatId(node_id: number | null) {
    if (!node_id) return null;
    let chatId = this.nodeChatIds.get(node_id);
    if (chatId) return chatId;
    chatId = this.genChatId();
    this.nodeChatIds.set(node_id, chatId);
    this.chatIdUserNetNode.set(chatId, { node_id });
    return chatId;
  }

  private getTreeChatId({ node_id }: IMemberNode) {
    return this.getNodeChatId(node_id);
  }

  private getCircleChatId({ parent_node_id }: IMemberNode) {
    return this.getNodeChatId(parent_node_id);
  }

  getUserNetNode(chatId: number) {
    return this.chatIdUserNetNode.get(chatId);
  }

  removeChat(chatId: number) {
    const { user_id, net_id, node_id } = this.getUserNetNode(chatId) || {};
    user_id && this.userChatIds.delete(user_id);
    net_id && this.netChatIds.delete(net_id);
    node_id && this.nodeChatIds.delete(node_id);
  }

  persistMessage(user_id: number, messageData: T.IChatSendMessage) {
    const { chatId, message } = messageData;
    const chatMessages = this.messages.get(chatId);
    let index: number;
    if (chatMessages) {
      const { index: lastIndex } = chatMessages.at(-1)!;
      index = (lastIndex % MAX_CHAT_MESSAGE_INDEX) + 1;
      chatMessages.push({ user_id, chatId, index, message });
      chatMessages.length > MAX_CHAT_MESSAGE_COUNT && chatMessages.shift();
    } else {
      index = 1;
      this.messages.set(chatId, [{ user_id, chatId, index, message }]);
    }
    const connectionIds = this.getChatConnections(chatId);
    const responseMessage = { chatId, user_id, index, message };
    return [responseMessage, connectionIds] as const;
  }

  getMessages({ chatId, index = 1 }: T.IChatGetMessages) {
    const chatMessages = this.messages.get(chatId);
    if (!chatMessages) return [];
    const { index: lastIndex } = chatMessages.at(-1)!;
    const count = lastIndex - index + 1;
    if (count < 1) return [];
    const allCount = chatMessages.length;
    const messages = chatMessages.slice(-Math.min(count, allCount));
    return messages;
  }

  private addChatAndConnection(chatId: number, connection: number) {
    this.addChatToConnection(chatId, connection);
    this.addConnectionToChat(connection, chatId);
  }

  getChatConnections(chatId: number) {
    return this.chatConnections.get(chatId);
  }

  private addChatToConnection(chatId: number, connection: number) {
    const chats = this.connectionChats.get(connection);
    if (chats) chats.add(chatId);
    else this.connectionChats.set(connection, new Set([chatId]));
  }

  private addConnectionToChat(connection: number, chatId: number) {
    const connections = this.chatConnections.get(chatId);
    if (connections) connections.add(connection);
    else this.chatConnections.set(chatId, new Set([connection]));
  }

  removeConnection(connectionId: number) {
    this.connectionUsers.delete(connectionId);
    const chatIds = this.connectionChats.get(connectionId);
    if (!chatIds) return false;
    for (const chatId of chatIds)
      this.removeConnectionFromChat(connectionId, chatId);
    return this.connectionChats.delete(connectionId);
  }

  private removeConnectionFromChat(connection: number, chatId: number) {
    const chatConnections = this.chatConnections.get(chatId);
    chatConnections!.delete(connection);
    if (chatConnections!.size === 0) {
      this.chatConnections.delete(chatId);
      this.removeChat(chatId);
    }
  }
}

export default () => new ChatService();

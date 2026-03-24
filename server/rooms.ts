import { Room } from "./gameEngine";
import { BattleRoyaleRoom } from "./brTypes";

export type AnyRoom = Room | BattleRoyaleRoom;

export const roomsById = new Map<string, AnyRoom>();
export const roomsByCode = new Map<string, AnyRoom>();

export function createRoom(room: AnyRoom) {
    roomsById.set(room.id, room);
    roomsByCode.set(room.code, room);
}

export function deleteRoom(id: string) {
    const room = roomsById.get(id);
    if (room) {
        roomsByCode.delete(room.code);
        roomsById.delete(id);
    }
}

export function getRoomByCode(code: string): AnyRoom | undefined {
    return roomsByCode.get(code);
}

export function is1v1Room(room: AnyRoom): room is Room {
    return room.mode === "1v1";
}

export function isBRRoom(room: AnyRoom): room is BattleRoyaleRoom {
    return room.mode === "battle_royale";
}
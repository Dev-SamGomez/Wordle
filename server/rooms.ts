import { Room } from "./gameEngine";

export const roomsById = new Map<string, Room>();
export const roomsByCode = new Map<string, Room>();

export function createRoom(room: Room) {
    roomsById.set(room.id, room);
    roomsByCode.set(room.code, room);
}

export function getRoomByCode(code: string) {
    return roomsByCode.get(code);
}

export function deleteRoom(id: string) {
    const room = roomsById.get(id);
    if (!room) return;

    roomsById.delete(id);
    roomsByCode.delete(room.code);
}
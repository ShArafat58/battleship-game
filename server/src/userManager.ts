import { User } from "./types";

export class UserManager {
  private users: Map<string, User> = new Map();
  private nameCount: Map<string, number> = new Map();

  addUser(socketId: string, requestedName: string): User {
    const trimmed = requestedName.trim();
    const baseName = trimmed || "Player";

    const count = this.nameCount.get(baseName.toLowerCase()) || 0;
    this.nameCount.set(baseName.toLowerCase(), count + 1);

    let displayName: string;
    if (count === 0) {
      displayName = baseName;
    } else {
      displayName = `${baseName} ${count + 1}`;
    }

    const user: User = { socketId, displayName };
    this.users.set(socketId, user);
    return user;
  }

  removeUser(socketId: string): User | undefined {
    const user = this.users.get(socketId);
    if (user) {
      this.users.delete(socketId);
    }
    return user;
  }

  getUser(socketId: string): User | undefined {
    return this.users.get(socketId);
  }

  hasUser(socketId: string): boolean {
    return this.users.has(socketId);
  }
}

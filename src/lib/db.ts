import Dexie, { Table, type EntityTable } from "dexie";
import { PlaylistItem } from "../types";

export type DBPlaylistItem = PlaylistItem["data"] & { id: string };

export const oldDb = new Dexie("FavouriteAudioDatabase") as Dexie & {
  audio: EntityTable<DBPlaylistItem, "id">;
};

oldDb.version(1).stores({
  audio: "id, title, artist, album, duration, time, cover, file",
});
oldDb.version(2).stores({
  audio: null,
});

export class AudioDB extends Dexie {
  audioItems!: Table<DBPlaylistItem, string>;
  constructor() {
    super("AudioDB");
    this.version(1).stores({
      audioItems: "id, title, artist, album, duration, time, cover, file",
    });
  }

  getAllAudioItems() {
    return this.transaction("r", this.audioItems, () =>
      this.audioItems.toArray()
    );
  }

  deleteAudioItem(audioItemId: string) {
    return this.transaction("rw", this.audioItems, () => {
      this.audioItems.where({ id: audioItemId }).delete();
    });
  }

  addAudioItem(data: DBPlaylistItem) {
    return this.transaction("rw", this.audioItems, () => {
      this.audioItems.add(data);
    });
  }
}

export const db = new AudioDB();

// db.on("populate", populate);

export function resetDatabase() {
  return db.transaction("rw", db.audioItems, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
    // await populate();
  });
}

// async function populate() {
//     const todoListId = await db.audioItems.add({ title: "To do Today" });

//     await db.todoItems.bulkAdd([
//         {
//             todoListId,
//             title: "Feed the birds"
//         },
//         {
//             todoListId,
//             title: "Watch a movie"
//         },
//         {
//             todoListId,
//             title: "Have some sleep"
//         },
//     ])
// }

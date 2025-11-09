import { parseBlob } from "music-metadata";
import { uint8ArrayToBase64 } from "uint8array-extras";
import { formatTime } from "./utils";
import { PlaylistItem } from "../types";

export async function parseFiles(audioFiles: File[]): Promise<PlaylistItem[]> {
  const audioFilesResultArray = [];

  for (const audioFile of audioFiles) {
    const fileUrl = URL.createObjectURL(audioFile);
    const uuid = crypto.randomUUID();
    let mm = {};
    try {
      const metadata = await parseBlob(audioFile, { duration: true });
      const common = metadata.common || {};
      const format = metadata.format || {};

      let coverUrl = null;
      if (common.picture && common.picture[0]) {
        // const blob = new Blob([common.picture[0].data], {
        //   type: common.picture[0].format,
        // });
        // coverUrl = URL.createObjectURL(blob);
        coverUrl = `data:${
          common.picture[0].format
        };base64,${uint8ArrayToBase64(common.picture[0].data)}`;
      }

      let duration = null;
      if (format.duration) {
        duration = formatTime(format.duration);
      } else {
        duration = "Unknown";
      }
      let title = common.title ? common.title : audioFile.name;
      title = title.replaceAll("_", " ").trimStart();

      mm = {
        title,
        artist: common.artist || "Unknown",
        album: common.album || "Unknown",
        duration,
        time: format.duration ?? null,
        cover: coverUrl,
        // cover: selectCover(common.picture),
      };
    } catch (error) {
      console.error("Error reading metadata for", audioFile.name, error);
      mm = {
        title: audioFile.name.replaceAll("_", " ").trimStart(),
        artist: "Unknown",
        album: "Unknown",
        duration: "Unknown",
        time: null,
        cover: null,
      };
    }
    audioFilesResultArray.push({
      id: uuid,
      data: { ...mm, file: fileUrl },
    } as PlaylistItem);
  }

  return audioFilesResultArray;
}

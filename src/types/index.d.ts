import { HTMLAttributes } from "react";

declare global {
  interface Window {
    webkitAudioContext: unknown;
  }
}

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

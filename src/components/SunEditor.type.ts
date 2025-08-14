// Type definitions
export interface SunEditorCore {
  getSelection(): Selection | null;
  execCommand(command: string, showDefaultUI: boolean, value?: string): void;
  getContents(): string;
  context: {
    element: {
      wysiwyg: HTMLElement;
      toolbar: HTMLElement;
    };
  };
}

export interface SunEditorInstance {
  core?: SunEditorCore;
  getContents?(): string;
  getSelection?(): Selection | null;
}

export interface UploadResult {
  url: string;
  name: string;
  size: number;
}

export interface UploadHandler {
  (result: { result: UploadResult[] }): void;
}

export interface CustomButtonHandlers {
  [key: string]: (editor: SunEditorInstance) => void;
}

export interface ButtonEventHandlers {
  btn: HTMLElement;
  handler: (event: Event) => void;
}
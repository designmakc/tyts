// The pages' bridge to the main process: the page posts through
// `window.tutorHost.post`, and messages from the main process arrive as
// window messages, the way the Tutor panel's webview receives them in VS Code.
// `call` is a request with an answer (the speech engine, dialogs); `pathOf`
// gives a dropped file's path, which a sandboxed page cannot see.

import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('tutorHost', {
  post: (message: unknown) => ipcRenderer.send('to-host', message),
  call: (request: unknown) => ipcRenderer.invoke('host-call', request),
  pathOf: (file: File) => webUtils.getPathForFile(file),
})

ipcRenderer.on('to-view', (_event, message: unknown) => window.postMessage(message, '*'))

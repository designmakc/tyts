// What a page is told when a call to the main process fails. Electron wraps the reason
// ("Error invoking remote method 'host-call': Error: needModel"), so a page that looked for
// 'needModel' never found it and showed the wrapper to the person (the owner, 0.5.5, a question
// on the Notes page). The preload gives the pages the reason alone.

export function hostReason(message: string): string {
  return message.replace(/^Error invoking remote method '[^']*': (?:\w*(?:Error|Exception)(?: \[\w+\])?: )?/, '')
}

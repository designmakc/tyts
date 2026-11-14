; Tyts's own part of the installer (electron-builder's NSIS templates include it).
;
; Install: the login item is Electron's, a value named after the app's id
; (com.designmakc.tyts) under HKCU's Run key, pointing at the program. An
; install into another folder points a login item already there at the new
; place, before Tyts first starts and sets it itself. No login item, nothing written.
;
; Uninstall asks once whether the data goes too: the settings, the words, the
; dictionaries, the translator's models and the voice (%APPDATA%\Tyts), the
; speech engine with its models (%LOCALAPPDATA%\Tyts) and the transcripts
; (Documents\Tyts). No keeps everything for a later install; an update never
; asks and never deletes. Notes in the person's knowledge base are theirs and
; are never touched. The question is in Tyts's interface language, which it
; keeps in HKCU\Software\Tyts (main.ts rememberUiLanguage); English when
; none. The key goes with any uninstall that is not an update.

!macro customInstall
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.designmakc.tyts"
  ${if} $0 != ""
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.designmakc.tyts" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
  ${endIf}
!macroend

!macro customUnInstall
  ${ifNot} ${isUpdated}
    ${ifNot} ${Silent}
      SetShellVarContext current
      ReadRegStr $1 HKCU "Software\Tyts" "UiLanguage"
      ${if} $1 == "uk"
        StrCpy $2 "Видалити також дані Тиць?$\r$\n$\r$\nТак — видаляє налаштування, збережені слова, словники, перекладач і голос, рушій мовлення з його моделями та розшифровки в Documents\Tyts.$\r$\n$\r$\nНі — залишає все для наступного встановлення. Нотатки у вашій базі знань залишаються в будь-якому разі."
      ${elseIf} $1 == "ru"
        StrCpy $2 "Удалить и данные Тиць?$\r$\n$\r$\nДа — удаляет настройки, сохранённые слова, словари, переводчик и голос, движок речи с его моделями и расшифровки в Documents\Tyts.$\r$\n$\r$\nНет — оставляет всё для следующей установки. Заметки в вашей базе знаний остаются в любом случае."
      ${else}
        StrCpy $2 "Delete Tyts's data too?$\r$\n$\r$\nYes removes the settings, the saved words, the dictionaries, the translator and the voice, the speech engine with its models, and the transcripts in Documents\Tyts.$\r$\n$\r$\nNo keeps all of it for a later install. Notes in your knowledge base stay either way."
      ${endIf}
      StrCpy $0 "keep"
      MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "$2" IDNO +2
      StrCpy $0 "delete"
      ${if} $0 == "delete"
        RMDir /r "$APPDATA\Tyts"
        RMDir /r "$LOCALAPPDATA\Tyts"
        RMDir /r "$DOCUMENTS\Tyts"
      ${endif}
    ${endIf}
    DeleteRegKey HKCU "Software\Tyts"
  ${endIf}
!macroend

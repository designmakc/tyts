; Kryakl's own part of the installer (electron-builder's NSIS templates include it).
;
; Install: the login item is Electron's, a value named after the app's id
; (com.designmakc.tyts) under HKCU's Run key, pointing at the program. Kryakl was
; Krya until 0.15 (Krya.exe) and Altype until 0.11 (Altype.exe): an update over
; either keeps the install folder (the registry's InstallLocation) but brings Kryakl.exe, so a
; login item already there is pointed at it now, before Kryakl first starts and
; sets it itself. No login item, nothing written.
;
; Uninstall asks once whether the data goes too: the settings, the words, the
; dictionaries, the translator's models and the voice (%APPDATA%\Kryakl and
; the folders of the app's earlier names), the speech engine with its models
; (%LOCALAPPDATA%\Kryakl, and Krya's and Altype's) and the transcripts
; (Documents\Kryakl, and Krya's and Altype's). No keeps everything for a later
; install; an update never asks and never deletes. Notes in the person's
; knowledge base are theirs and are never touched. The question is in Kryakl's
; interface language, which Tyts keeps in HKCU\Software\Tyts (main.ts
; rememberUiLanguage; Kryakl kept it in Software\Kryakl and Krya in Software\Krya, read when Tyts has not
; written its own yet); English when none. Both keys go with any uninstall that
; is not an update.

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
      ${if} $1 == ""
        ReadRegStr $1 HKCU "Software\Kryakl" "UiLanguage"
      ${endIf}
      ${if} $1 == ""
        ReadRegStr $1 HKCU "Software\Krya" "UiLanguage"
      ${endIf}
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
        RMDir /r "$APPDATA\Kryakl"
        RMDir /r "$APPDATA\Krya"
        RMDir /r "$APPDATA\Altype"
        RMDir /r "$APPDATA\2Talker"
        RMDir /r "$APPDATA\tu-talk"
        RMDir /r "$LOCALAPPDATA\Kryakl"
        RMDir /r "$LOCALAPPDATA\Krya"
        RMDir /r "$LOCALAPPDATA\Altype"
        RMDir /r "$DOCUMENTS\Kryakl"
        RMDir /r "$DOCUMENTS\Krya"
        RMDir /r "$DOCUMENTS\Altype"
      ${endif}
    ${endIf}
    DeleteRegKey HKCU "Software\Tyts"
    DeleteRegKey HKCU "Software\Kryakl"
    DeleteRegKey HKCU "Software\Krya"
  ${endIf}
!macroend

# language-kumachan

A support package of the [KumaChan](https://notabug.org/mizusato/KumaChan) programming language for the Atom Editor. (Experimental)

Features:
- Syntax Highlighting
- Autocomplete
- Lint on Save
- Rename (limitation: only available for local bindings)
- File Outline (requires atom-ide-ui)
- Quick Run

Key Bindings:
- Rename: Shift+F6
- Run File: Shift+F7
- Run Project: Shift+F8

Note:
In order to enable "Autocomplete", "Lint on Save" and "Quick Run", the environment variable `KUMACHAN_PATH` should be set to the path of a directory containing built KumaChan interpreter binary and standard library code.


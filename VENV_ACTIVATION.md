# Automatic virtualenv activation

This repo includes convenience settings and scripts to help automatically activate a Python virtual environment when you open a terminal.

What was added
- VS Code setting: `.vscode/settings.json` enables `python.terminal.activateEnvironment`.
- PowerShell helper: `scripts/auto_activate.ps1` — sources `.venv` or `venv` Activate.ps1 when present.

Quick instructions

- VS Code: Make sure the Python extension is installed. The workspace setting in `.vscode/settings.json` will let the extension auto-activate the selected interpreter's venv.

- PowerShell (recommended): Add the following line to your PowerShell profile (`$PROFILE`) so the repo’s venv is activated when you open a terminal in the project root or `cd` into it:

```
if (Test-Path ./scripts/auto_activate.ps1) { . ./scripts/auto_activate.ps1 }
```

To open your profile in Notepad and edit it, run:

```
if (!(Test-Path -Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }
notepad $PROFILE
```

- Bash / WSL: add this to your `~/.bashrc` or `~/.profile` if you want similar behavior:

```
if [ -f "./.venv/bin/activate" ]; then
  source ./.venv/bin/activate
elif [ -f "./venv/bin/activate" ]; then
  source ./venv/bin/activate
fi
```

Security note: these snippets only source `activate` scripts if they exist in the current working directory. Review any scripts before sourcing if you have security concerns.

If you’d like, I can add the PowerShell snippet directly to your `$PROFILE` now — say `yes` to proceed and I will append it.

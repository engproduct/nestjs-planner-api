#!/usr/bin/env bash
# Funções comuns dos git hooks. Usado via `source`.

# Carrega o Node do .nvmrc (a GUI do VS Code não carrega o nvm) e confere a versão.
use_node() {
  local root expected
  root="$(git rev-parse --show-toplevel)"
  expected="v$(tr -d '[:space:]' < "$root/.nvmrc")"
  if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
    (cd "$root" && nvm use --silent >/dev/null 2>&1) || true
    # nvm use dentro de subshell não persiste: repete no shell atual
    cd "$root" && nvm use --silent >/dev/null 2>&1 || true
  fi
  if [ "$(node -v 2>/dev/null)" != "$expected" ]; then
    echo "Node incorreto: esperado $expected, atual $(node -v 2>/dev/null || echo ausente). Rode 'nvm use' na raiz." >&2
    exit 1
  fi
}

# Entra em planner-api/ a partir da raiz do repositório.
cd_app() {
  cd "$(git rev-parse --show-toplevel)/planner-api" || exit 1
}

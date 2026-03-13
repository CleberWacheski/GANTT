# Gantt — Build para Produção no macOS

## 1. Icones

### Requisitos

| Arquivo     | Local                | Tamanho recomendado | Uso                                             |
| ----------- | -------------------- | ------------------- | ----------------------------------------------- |
| `icon.icns` | `build/icon.icns`    | 1024x1024 px        | Ícone do app no macOS (Dock, Finder, Launchpad) |
| `icon.png`  | `build/icon.png`     | 1024x1024 px        | Fallback genérico / Linux                       |
| `icon.png`  | `resources/icon.png` | 512x512 px          | Ícone em tempo de execução (tray, janela Linux) |
| `icon.ico`  | `build/icon.ico`     | 256x256 px          | Ícone do app no Windows                         |

> **Importante:** O ícone atual é 512x512. Para telas Retina, o ideal é **1024x1024 px** com fundo transparente (RGBA).

### Gerar `.icns` a partir de um PNG 1024x1024

```bash
# 1. Crie o iconset
mkdir icon.iconset

# 2. Gere todos os tamanhos necessários
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# 3. Converta para .icns
iconutil -c icns icon.iconset -o build/icon.icns

# 4. Copie o PNG para build/
cp icon-1024.png build/icon.png

# 5. Limpe
rm -rf icon.iconset
```

### Onde cada ícone é usado

```
build/
├── icon.icns          ← electron-builder usa para gerar o .app no macOS
├── icon.ico           ← electron-builder usa para o .exe no Windows
├── icon.png           ← fallback genérico
└── entitlements.mac.plist

resources/
└── icon.png           ← usado em runtime (BrowserWindow no Linux)
```

---

## 2. Configuração do `electron-builder.yml`

O arquivo já está configurado. Pontos importantes para produção:

```yaml
appId: com.seudominio.gantt # Altere para seu domínio reverso
productName: Gantt # Nome com inicial maiúscula
```

### Seção `mac` (produção)

```yaml
mac:
  category: public.app-category.project-management
  entitlementsInherit: build/entitlements.mac.plist
  icon: build/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  extendInfo:
    - NSCameraUsageDescription: Application requests access to the device's camera.
    - NSMicrophoneUsageDescription: Application requests access to the device's microphone.
    - NSDocumentsFolderUsageDescription: Application requests access to the user's Documents folder.
    - NSDownloadsFolderUsageDescription: Application requests access to the user's Downloads folder.
  # Para distribuir na App Store ou fora dela com notarização:
  notarize: true # Requer Apple Developer ID (veja seção 4)
```

### Seção `dmg`

```yaml
dmg:
  artifactName: Gantt-${version}.dmg
  title: Gantt ${version}
  icon: build/icon.icns
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
```

---

## 3. Comandos de Build

```bash
# Instalar dependências
pnpm install

# Verificar tipos
pnpm run typecheck

# Lint
pnpm run lint

# Formatar código
pnpm run format

# Build completo (typecheck + vite build + electron-builder)
pnpm run build:mac

# Build sem empacotar (para testar localmente)
pnpm run build:unpack

# Build apenas o código (sem gerar .dmg)
pnpm run build && npx electron-builder --mac --dir
```

### Testar o app empacotado

```bash
# Após build:unpack, o .app fica em:
open dist/mac-arm64/Gantt.app    # Apple Silicon
open dist/mac/Gantt.app           # Intel
```

---

## 4. Code Signing e Notarização

Para distribuir o app fora da App Store, é necessário assinar e notarizar.

### Pré-requisitos

1. **Apple Developer Account** ($99/ano) — https://developer.apple.com
2. **Developer ID Application certificate** instalado no Keychain
3. **App-specific password** para notarização

### Variáveis de ambiente

```bash
# Certificado (nome exato como aparece no Keychain Access)
export CSC_NAME="Developer ID Application: Seu Nome (TEAMID)"

# Ou usando arquivo .p12
export CSC_LINK=/caminho/para/certificado.p12
export CSC_KEY_PASSWORD=senha_do_certificado

# Notarização (Apple ID + App-specific password)
export APPLE_ID=seu@email.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
export APPLE_TEAM_ID=XXXXXXXXXX
```

### Build com assinatura + notarização

```bash
# Com as variáveis de ambiente configuradas:
pnpm run build:mac
```

O electron-builder automaticamente assina e notariza quando detecta as variáveis.

### Sem Apple Developer Account (distribuição local)

Se não tiver conta de desenvolvedor, o app ainda funciona localmente, mas o macOS exibirá um aviso de "desenvolvedor não identificado". O usuário pode abrir via:

```
Preferências do Sistema → Privacidade e Segurança → Abrir Mesmo Assim
```

Ou via terminal:

```bash
xattr -cr /Applications/Gantt.app
```

---

## 5. Entitlements (`build/entitlements.mac.plist`)

O arquivo atual contém:

| Entitlement                                              | Motivo                                          |
| -------------------------------------------------------- | ----------------------------------------------- |
| `com.apple.security.cs.allow-jit`                        | Necessário para o V8 (Chromium/Electron)        |
| `com.apple.security.cs.allow-unsigned-executable-memory` | Necessário para o V8 JIT                        |
| `com.apple.security.cs.allow-dyld-environment-variables` | Necessário para native modules (better-sqlite3) |

> Estes entitlements são o mínimo necessário para apps Electron com módulos nativos.

---

## 6. Checklist de Produção

- [ ] Atualizar `appId` em `electron-builder.yml` para seu domínio reverso (ex: `com.seudominio.gantt`)
- [ ] Atualizar `productName` para `Gantt` (com maiúscula)
- [ ] Atualizar `author` em `package.json`
- [ ] Atualizar `description` em `package.json`
- [ ] Gerar ícone 1024x1024 e converter para `.icns`
- [ ] Configurar `category` no `mac` (ex: `public.app-category.project-management`)
- [ ] Obter Apple Developer ID certificate
- [ ] Configurar variáveis de ambiente para code signing
- [ ] Habilitar `notarize: true` no `electron-builder.yml`
- [ ] Configurar URL real de auto-update em `publish.url`
- [ ] Testar build com `pnpm run build:mac`
- [ ] Testar instalação do `.dmg` em outra máquina
- [ ] Verificar que o app abre sem aviso de Gatekeeper

---

## 7. Estrutura de Arquivos Relevantes

```
GANTT/
├── build/
│   ├── entitlements.mac.plist   ← permissões do macOS sandbox
│   ├── icon.icns                ← ícone macOS (substituir por 1024x1024)
│   ├── icon.ico                 ← ícone Windows
│   └── icon.png                 ← ícone genérico
├── resources/
│   └── icon.png                 ← ícone runtime
├── electron-builder.yml         ← configuração do empacotamento
├── package.json                 ← scripts de build
└── src/
    └── main/index.ts            ← entrada do processo principal
```

---

## 8. Categorias macOS Disponíveis

Para o campo `mac.category` no `electron-builder.yml`:

| Categoria                 | Valor                                    |
| ------------------------- | ---------------------------------------- |
| Produtividade             | `public.app-category.productivity`       |
| Gerenciamento de Projetos | `public.app-category.project-management` |
| Negócios                  | `public.app-category.business`           |
| Utilitários               | `public.app-category.utilities`          |
| Desenvolvimento           | `public.app-category.developer-tools`    |

---

## 9. Auto-Update (Sparkle/electron-updater)

O `electron-builder.yml` já tem uma seção `publish` com provider `generic`. Para ativar auto-update em produção:

1. Hospede os artefatos (`.dmg`, `latest-mac.yml`) em um servidor/CDN
2. Atualize a URL em `electron-builder.yml`:

```yaml
publish:
  provider: generic
  url: https://releases.seudominio.com/gantt
```

3. Ou use GitHub Releases:

```yaml
publish:
  provider: github
  owner: seu-usuario
  repo: gantt
```

4. No código principal (`src/main/index.ts`), o `@electron-toolkit/utils` já gerencia o auto-updater se configurado.

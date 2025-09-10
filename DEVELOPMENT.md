# PeakSuite.ai Development Guide

## 🚀 Quick Start
```bash
npm run dev
```
Access at: http://localhost:3000 or http://localhost:3001

## 📦 Critical Dependencies (DO NOT CHANGE)
- **Tailwind CSS**: `3.4.13` (stable) - NEVER upgrade to v4+ until stable
- **Next.js**: `14.2.16` - Current stable
- **React**: `18.x` - Stable

## 🛡️ Before Making Changes
1. **Commit your work**: `git add . && git commit -m "Save before changes"`
2. **Check dependencies**: `npm list tailwindcss`
3. **Test locally**: Make sure everything works before changes

## 🚨 If Styling Breaks
1. **DON'T PANIC** - Your code is safe in git
2. Check if Tailwind CSS version changed: `npm list tailwindcss`
3. If v4+ installed, downgrade: `npm install tailwindcss@3.4.13`
4. Clear cache: `rm -rf .next`
5. Restart: `npm run dev`

## 🔧 Safe Cache Clearing
```bash
# Safe method
npm run dev -- --turbo-off

# Nuclear option (only if needed)
rm -rf .next && npm run dev
```

## 📋 Environment Check
- Node.js: 18+ required
- npm: 9+ required
- Ports: 3000/3001 (auto-fallback)

## 🆘 Emergency Recovery
If everything breaks:
```bash
git status                          # Check what changed
git checkout -- package.json        # Restore package.json
npm install                         # Reinstall deps
rm -rf .next                        # Clear cache
npm run dev                         # Restart
```

## ✅ Known Working Configuration
- Tailwind CSS: 3.4.13
- PostCSS: Standard v3 config
- CSS Variables: HSL format (not oklch)
- Config: tailwind.config.ts (v3 format)
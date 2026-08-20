// 判定在 @phenomcanvas/ui 的 scripts/lib/color-system.mjs（站群共用一份），
// 本倉不存 tokens.css，查的是套件供應的那一份。共用層加一條規則，本倉下一次執行就吃得到。
import { runColorSystem } from '@phenomcanvas/ui/validators/lib/color-system.mjs';

runColorSystem();

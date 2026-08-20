// 判定在 @phenomcanvas/ui 的 scripts/lib/color-system.mjs（站群共用一份），
// 這裡只宣告本倉的路徑。共用層加一條規則，本倉下一次執行就吃得到。
import { runColorSystem } from '@phenomcanvas/ui/validators/lib/color-system.mjs';

runColorSystem({ tokensPath: 'src/styles/tokens.css' });

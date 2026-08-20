// 判定在 @phenomcanvas/ui 的 scripts/lib/design-tokens.mjs（站群共用一份）。
import { runDesignTokens } from '@phenomcanvas/ui/validators/lib/design-tokens.mjs';

runDesignTokens({ root: 'src', exceptionsPath: 'scripts/design-token-exceptions.txt' });

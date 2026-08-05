import { getStyleProfile, type ToneKey } from "./style-profile";

// 現行の単一HTMLを保ったまま、今後の認識・変換処理を分割するための入口。
export function createStyleProfile(tone: ToneKey) {
  return getStyleProfile(tone);
}

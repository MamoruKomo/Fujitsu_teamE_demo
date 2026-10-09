import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Check,
  Upload,
  ScanLine,
  Plus,
  Trash2,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import {
  ALLERGENS,
  AREAS,
  CUISINES,
  INGREDIENTS,
  STATUS_LABELS,
  allergenLabel,
} from "../data/constants";
import { MOCK_RECEIPT, photo } from "../data/seed";
import type { Restaurant, MenuItem, AllergenStatus } from "../types";
import { useStore } from "../hooks/useStore";
import { reconcileAllergens } from "../lib/matching";
import { AllergenPanel, Empty, FoodImage, Tags, yen } from "../components/ui";
const steps = [
  "基本情報",
  "レシート",
  "抽出商品",
  "情報の確認",
  "メニュー",
  "登録",
];
const newMenu = (): MenuItem => ({
  id: crypto.randomUUID(),
  name: "",
  price: 1500,
  description: "",
  image: photo("salad"),
  ingredients: [],
  allergens: [],
  allergenReviewStatus: "unconfirmed",
});
const newRestaurant = (): Restaurant => ({
  id: crypto.randomUUID(),
  name: "",
  area: "渋谷",
  cuisine: "和食",
  price: 2500,
  description: "",
  images: [photo("japanese"), photo("salad")],
  address: "",
  location: { x: 52, y: 45 },
  openingHours: "11:00–21:00",
  rating: 0,
  allergenStatuses: Object.fromEntries(
    ALLERGENS.map(([id]) => [id, "unknown"]),
  ),
  crossContactInfo:
    "調理環境・交差接触への対応は未確認です。利用前に店舗への確認が必要です。",
  menus: [newMenu()],
  reviews: [],
});
export default function RestaurantForm() {
  const { id } = useParams();
  const { data, update } = useStore();
  const existing = data.restaurants.find((r) => r.id === id);
  const navigate = useNavigate();
  const [r, setR] = useState<Restaurant>(() =>
    existing ? structuredClone(existing) : newRestaurant(),
  );
  const [step, setStep] = useState(0);
  const [receipt, setReceipt] = useState("");
  const [filename, setFilename] = useState("");
  const [reading, setReading] = useState(false);
  const [read, setRead] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState(
    MOCK_RECEIPT.products.map((p) => ({
      ...p,
      candidates: [...p.candidates],
      confirmed: false,
    })),
  );
  const [accepted, setAccepted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(
    () => () => {
      if (receipt.startsWith("blob:")) URL.revokeObjectURL(receipt);
    },
    [receipt],
  );
  if (id && !existing) return <Empty title="編集するお店が見つかりません" />;
  const set = <K extends keyof Restaurant>(key: K, value: Restaurant[K]) =>
    setR((p) => ({ ...p, [key]: value }));
  const menuSet = (menuId: string, change: Partial<MenuItem>) =>
    setR((p) => ({
      ...p,
      menus: p.menus.map((m) => (m.id === menuId ? { ...m, ...change } : m)),
    }));
  const upload = (file?: File) => {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("JPEG・PNG・WebP画像（8MB以内）を選んでください。");
      return;
    }
    setError("");
    setFilename(file.name);
    setReceipt(URL.createObjectURL(file));
    setRead(false);
  };
  const runOcr = () => {
    setReading(true);
    setRead(false);
    timer.current = setTimeout(() => {
      setReading(false);
      setRead(true);
      setProducts(
        MOCK_RECEIPT.products.map((p) => ({
          ...p,
          candidates: [...p.candidates],
          confirmed: false,
        })),
      );
    }, 1400);
  };
  const usedProducts = products
    .filter((p) => p.confirmed)
    .flatMap((p) => p.candidates);
  const final = reconcileAllergens({
    ...r,
    allergenStatuses: {
      ...r.allergenStatuses,
      ...Object.fromEntries(usedProducts.map((a) => [a, "used"])),
    },
  });
  const discrepancies = ALLERGENS.filter(
    ([a]) => final.allergenStatuses[a] !== r.allergenStatuses[a],
  );
  const next = () => {
    if (step === 2)
      setR((p) => ({
        ...p,
        allergenStatuses: {
          ...p.allergenStatuses,
          ...Object.fromEntries(usedProducts.map((a) => [a, "used"])),
        },
      }));
    if (step === 4 && r.menus.some((m) => !m.name.trim() || m.price <= 0)) {
      setError("すべてのメニュー名と、0円より大きい価格を入力してください。");
      return;
    }
    setError("");
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };
  const save = () => {
    if (!accepted) return;
    const normalized = {
      ...final,
      name: final.name.trim(),
      menus: final.menus.map((m) => ({ ...m, name: m.name.trim() })),
    };
    if (
      update((d) => ({
        ...d,
        restaurants: id
          ? d.restaurants.map((store) => (store.id === id ? normalized : store))
          : [...d.restaurants, normalized],
      }))
    )
      navigate(`/restaurants/${r.id}`);
  };
  return (
    <div className="registration-page">
      <Link className="back-link" to={id ? `/restaurants/${id}` : "/"}>
        戻る
      </Link>
      <div className="page-title">
        <div className="eyebrow">FOR RESTAURANTS</div>
        <h1>{id ? "店舗情報を編集" : "お店の魅力と、食材の情報を。"}</h1>
        <p>デモ用の店舗情報を登録します。ログインは不要です。</p>
      </div>
      <ol className="registration-steps">
        {steps.map((s, i) => (
          <li
            key={s}
            className={step === i ? "active" : step > i ? "done" : ""}
          >
            <span>{step > i ? <Check size={16} /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <form
        className="form-card registration-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 5) save();
          else next();
        }}
      >
        <div className="step-heading">
          <span>STEP {step + 1} / 6</span>
          <h2>{steps[step]}</h2>
        </div>
        {step === 0 && (
          <>
            <div className="form-grid">
              <label className="field">
                店舗名
                <input
                  autoFocus
                  required
                  maxLength={60}
                  pattern={".*\\S.*"}
                  value={r.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="例：季節の食卓 こもれび"
                />
              </label>
              <label className="field">
                エリア
                <select
                  value={r.area}
                  onChange={(e) => set("area", e.target.value)}
                >
                  {AREAS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                料理ジャンル
                <select
                  value={r.cuisine}
                  onChange={(e) => {
                    set("cuisine", e.target.value);
                    if (!id)
                      set("images", [
                        photo(
                          (
                            {
                              和食: "japanese",
                              洋食: "steak",
                              中華: "chinese",
                              イタリアン: "pasta",
                              韓国料理: "korean",
                              焼肉: "steak",
                              寿司: "sushi",
                              カフェ: "cafe",
                              エスニック: "curry",
                            } as Record<string, string>
                          )[e.target.value],
                        ),
                        photo("salad"),
                      ]);
                  }}
                >
                  {CUISINES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                1人あたりの予算（円）
                <input
                  required
                  type="number"
                  min="1"
                  max="100000"
                  value={r.price}
                  onChange={(e) => set("price", Number(e.target.value))}
                />
              </label>
              <label className="field span-2">
                住所（架空）
                <input
                  required
                  maxLength={100}
                  value={r.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="例：東京都渋谷区こもれび町1-2-3"
                />
              </label>
              <label className="field span-2">
                営業時間
                <input
                  required
                  maxLength={80}
                  value={r.openingHours}
                  onChange={(e) => set("openingHours", e.target.value)}
                />
              </label>
              <label className="field span-2">
                店舗紹介
                <textarea
                  required
                  maxLength={500}
                  rows={4}
                  value={r.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="料理やお店の雰囲気を教えてください"
                />
              </label>
            </div>
            <p className="small muted">
              写真はジャンルに応じたイメージ写真を設定します。
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <div className="ocr-badge">
              <ScanLine size={19} />
              模擬OCR · 実際の文字認識は行いません
            </div>
            <p>
              アップロード画像に関係なく、サンプルレシートの固定結果を表示します。実際の仕入れ・原材料情報には使わないでください。
            </p>
            <label className="upload-box">
              <Upload size={30} />
              <strong>{filename || "レシート画像を選択"}</strong>
              <span>JPEG・PNG・WebP / 8MBまで</span>
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            <div className="receipt-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setReceipt(MOCK_RECEIPT.image);
                  setFilename("サンプルレシート");
                  setRead(false);
                }}
              >
                サンプルレシートを使う
              </button>
              {receipt && (
                <button
                  type="button"
                  className="button primary"
                  disabled={reading}
                  onClick={runOcr}
                >
                  {reading ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <ScanLine size={17} />
                  )}{" "}
                  {reading ? "模擬読み取り中…" : "読み取る（模擬）"}
                </button>
              )}
            </div>
            {receipt && (
              <div className={`receipt-preview ${reading ? "scanning" : ""}`}>
                <img src={receipt} alt="選択したレシート" />
                {reading && <span className="scan-line" />}
              </div>
            )}
            {read && (
              <div className="green-notice" role="status">
                <Check size={18} />
                固定サンプルの6商品を表示できます。次へ進んで確認してください。
              </div>
            )}
            <button
              type="button"
              className="text-link small"
              disabled={reading}
              onClick={() => {
                setRead(false);
                setStep(3);
              }}
            >
              レシートを使わず、手動確認へ進む
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <p>
              商品マスタとの照合候補です。ラベルを確認した想定で、商品ごとに候補を修正し「確認した」を選んでください。未確認の商品は確定情報に反映しません。
            </p>
            <div className="product-list">
              {products.map((p, i) => (
                <div
                  className={`product-row ${p.confirmed ? "confirmed" : ""}`}
                  key={p.name}
                >
                  <div>
                    <strong>{p.name}</strong>
                    <span className="small muted">
                      メニューに紐付ける食材：{p.ingredient}
                    </span>
                    <Tags
                      options={ALLERGENS}
                      selected={p.candidates}
                      onChange={(candidates) =>
                        setProducts((ps) =>
                          ps.map((x, j) =>
                            i === j
                              ? { ...x, candidates, confirmed: false }
                              : x,
                          ),
                        )
                      }
                    />
                    {p.note && <p className="small muted">{p.note}</p>}
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={p.confirmed}
                      onChange={(e) =>
                        setProducts((ps) =>
                          ps.map((x, j) =>
                            i === j ? { ...x, confirmed: e.target.checked } : x,
                          ),
                        )
                      }
                    />
                    確認した
                  </label>
                </div>
              ))}
            </div>
            <div className="notice compact">
              レシートに載っていない食材を「不使用」とは判定しません。調味料・加工食品の原材料も別途確認が必要です。
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <p>
              店舗全体の使用状況を確認してください。サンプル商品の確認済み候補は「使用あり」に反映されます。不使用は、店舗全体で確認した場合だけ選んでください。
            </p>
            <div className="allergen-editor">
              {ALLERGENS.map(([a, label]) => (
                <label key={a}>
                  <strong>{label}</strong>
                  <select
                    aria-label={`${label}の店舗全体の使用状況`}
                    value={r.allergenStatuses[a] ?? "unknown"}
                    onChange={(e) =>
                      set("allergenStatuses", {
                        ...r.allergenStatuses,
                        [a]: e.target.value as AllergenStatus,
                      })
                    }
                  >
                    {Object.entries(STATUS_LABELS).map(([value, text]) => (
                      <option value={value} key={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <label className="field">
              調理環境・交差接触について
              <textarea
                required
                rows={3}
                maxLength={500}
                value={r.crossContactInfo}
                onChange={(e) => set("crossContactInfo", e.target.value)}
              />
            </label>
          </>
        )}
        {step === 4 && (
          <>
            <p>
              食材はメニューごとに選択してください。確認済み商品の食材も、全メニューへ自動で割り当てることはありません。
            </p>
            {r.menus.map((m, i) => (
              <section className="menu-editor" key={m.id}>
                <div className="section-heading">
                  <h3>メニュー {i + 1}</h3>
                  {r.menus.length > 1 && (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`メニュー${i + 1}を削除`}
                      onClick={() =>
                        set(
                          "menus",
                          r.menus.filter((menu) => menu.id !== m.id),
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  <label className="field">
                    メニュー名
                    <input
                      required
                      maxLength={60}
                      pattern={".*\\S.*"}
                      value={m.name}
                      onChange={(e) => menuSet(m.id, { name: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    価格（円）
                    <input
                      required
                      type="number"
                      min="1"
                      max="100000"
                      value={m.price}
                      onChange={(e) =>
                        menuSet(m.id, { price: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label className="field span-2">
                    説明文
                    <input
                      maxLength={180}
                      value={m.description}
                      onChange={(e) =>
                        menuSet(m.id, { description: e.target.value })
                      }
                    />
                  </label>
                </div>
                <h4>使用食材</h4>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={m.ingredients === null}
                    onChange={(e) =>
                      menuSet(m.id, {
                        ingredients: e.target.checked ? null : [],
                        allergenReviewStatus: "unconfirmed",
                      })
                    }
                  />
                  食材情報は未確認
                </label>
                {m.ingredients !== null && (
                  <Tags
                    options={[
                      ...new Set([
                        ...INGREDIENTS,
                        ...products
                          .filter((p) => p.confirmed)
                          .map((p) => p.ingredient),
                      ]),
                    ]}
                    selected={m.ingredients}
                    onChange={(ingredients) =>
                      menuSet(m.id, { ingredients, allergenReviewStatus: "unconfirmed" })
                    }
                  />
                )}
                <h4>メニューに含まれるアレルゲン</h4>
                <Tags
                  options={ALLERGENS}
                  selected={m.allergens}
                  onChange={(allergens) =>
                    menuSet(m.id, {
                      allergens,
                      allergenReviewStatus: "unconfirmed",
                    })
                  }
                />
                <label className="checkbox-label review-confirm">
                  <input
                    type="checkbox"
                    checked={m.allergenReviewStatus === "confirmed"}
                    onChange={(e) =>
                      menuSet(m.id, {
                        allergenReviewStatus: e.target.checked
                          ? "confirmed"
                          : "unconfirmed",
                      })
                    }
                  />
                  このメニューの原材料・アレルゲン情報を確認した
                </label>
              </section>
            ))}
            <button
              type="button"
              className="button secondary"
              disabled={r.menus.length >= 8}
              onClick={() => set("menus", [...r.menus, newMenu()])}
            >
              <Plus size={17} />
              メニューを追加
            </button>
            <p className="small muted">
              確認済みメニューに含まれるアレルゲンは、店舗全体でも「使用あり」に更新します。未確認メニューはおすすめに選ばれません。
            </p>
          </>
        )}
        {step === 5 && (
          <>
            <div className="registration-preview">
              <FoodImage src={r.images[0]} alt="店舗のイメージ" />
              <div>
                <h3>{r.name}</h3>
                <p>
                  {r.area} · {r.cuisine} · {yen(r.price)} / 人
                </p>
                <p>
                  {r.menus.length}品のメニュー · 確認済み{" "}
                  {
                    r.menus.filter(
                      (m) => m.allergenReviewStatus === "confirmed",
                    ).length
                  }
                  品
                </p>
              </div>
            </div>
            <h3>店舗全体のアレルゲン情報</h3>
            <AllergenPanel restaurant={final} />
            {discrepancies.length > 0 && (
              <div className="notice compact">
                <ShieldCheck size={18} />
                <p>
                  商品・メニューとの矛盾を防ぐため、
                  {discrepancies.map(([a]) => allergenLabel(a)).join("・")}
                  の使用状況を更新します。
                </p>
              </div>
            )}
            <label className="checkbox-label review-confirm">
              <input
                type="checkbox"
                required
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              デモ情報として確認しました。登録内容を検索に反映します。
            </label>
          </>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="form-actions">
          {step > 0 && (
            <button
              type="button"
              className="button secondary"
              disabled={reading}
              onClick={() => {
                setStep((s) => s - 1);
                setError("");
              }}
            >
              戻る
            </button>
          )}
          <button
            className="button primary"
            type="submit"
            disabled={
              reading || (step === 1 && !read) || (step === 5 && !accepted)
            }
          >
            {step === 5 ? (
              <>
                <Check size={17} />
                {id ? "変更を保存" : "店舗を登録する"}
              </>
            ) : (
              "次へ進む"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

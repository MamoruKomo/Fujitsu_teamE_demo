import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  MapPin,
  Star,
  Clock,
  Pencil,
  ShieldCheck,
  Check,
  Utensils,
  Users,
} from "lucide-react";
import { useStore } from "../hooks/useStore";
import { allergenLabel } from "../data/constants";
import { matchRestaurants } from "../lib/matching";
import {
  AllergenPanel,
  Empty,
  FoodImage,
  Notice,
  Recommendations,
  yen,
} from "../components/ui";
export default function Detail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data, update } = useStore();
  const navigate = useNavigate();
  const r = data.restaurants.find((r) => r.id === id);
  const group = data.groups.find((g) => g.id === params.get("group"));
  if (!r) return <Empty title="お店が見つかりません" />;
  const members = group?.members ?? [data.profile];
  const result = matchRestaurants([r], members, "", Infinity);
  const match = result.matches[0];
  const choose = () => {
    if (!group || !match) return;
    if (
      update((d) => ({
        ...d,
        groups: d.groups.map((g) =>
          g.id === group.id ? { ...g, selectedRestaurantId: r.id } : g,
        ),
      }))
    )
      navigate(`/groups/${group.id}/decision`);
  };
  return (
    <>
      <Link
        to={group ? `/search?group=${group.id}` : "/search?mode=personal"}
        className="back-link"
      >
        お店一覧へ戻る
      </Link>
      <div className="detail-heading">
        <div className="eyebrow">
          {r.area} · {r.cuisine}
        </div>
        <h1>{r.name}</h1>
        <div className="detail-meta">
          <span>
            <Star size={17} fill="currentColor" />
            {r.rating} <small>（架空の口コミ）</small>
          </span>
          <span>
            <MapPin size={17} />
            {r.area}
          </span>
          <span>{yen(r.price)} / 人</span>
        </div>
      </div>
      <div className="detail-photos">
        <FoodImage src={r.images[0]} alt={`${r.name}の料理写真（イメージ）`} />
        <FoodImage src={r.images[1]} alt="料理のイメージ写真" />
      </div>
      <p className="photo-caption">
        料理写真はイメージです。料理・店舗・口コミ・原材料情報はすべてデモ用です。
      </p>
      <div className="detail-columns">
        <div>
          <section className="detail-section">
            <h2>季節のおいしさを、気負わずに。</h2>
            <p>{r.description}</p>
            <p className="with-icon muted">
              <Clock size={18} />
              {r.openingHours}
            </p>
          </section>
          <section className="detail-section">
            <div className="section-heading">
              <h2>
                <ShieldCheck size={22} />
                店舗全体のアレルゲン情報
              </h2>
              <Link
                className="text-link small"
                to={`/restaurants/${r.id}/edit`}
              >
                <Pencil size={14} />
                編集
              </Link>
            </div>
            <p className="muted small">
              メニューごとの情報と区別して、店舗全体での使用状況を表示しています。未登録の項目は「未確認」です。
            </p>
            <AllergenPanel restaurant={r} />
            <div className="contact-note">
              <strong>調理環境・交差接触について</strong>
              <p>{r.crossContactInfo}</p>
            </div>
            <Notice />
          </section>
          <section className="detail-section">
            <h2>
              <Utensils size={22} />
              メニュー
            </h2>
            <div className="menu-list">
              {r.menus.map((menu) => (
                <article className="menu-item" key={menu.id}>
                  <FoodImage
                    src={menu.image}
                    alt={`${menu.name}（写真はイメージ）`}
                  />
                  <div>
                    <div className="menu-heading">
                      <h3>{menu.name}</h3>
                      <strong>{yen(menu.price)}</strong>
                    </div>
                    <p className="muted small">{menu.description}</p>
                    <p className="small">
                      使用食材：{menu.ingredients?.join("・") || "未確認"}
                    </p>
                    <div className="tags">
                      <span
                        className={`tag ${menu.allergenReviewStatus === "confirmed" ? "not_used" : "unknown"}`}
                      >
                        {menu.allergenReviewStatus === "confirmed"
                          ? "アレルゲン情報確認済み"
                          : "アレルゲン情報未確認"}
                      </span>
                      {menu.allergens.map((a) => (
                        <span className="tag neutral" key={a}>
                          {allergenLabel(a)}
                        </span>
                      ))}
                      {!menu.allergens.length && (
                        <span className="small muted">登録アレルゲンなし</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="detail-section">
            <h2>
              <Star size={22} />
              口コミ<span className="tag neutral">架空の体験談</span>
            </h2>
            <p className="small muted">
              口コミはアレルギー判定には使用しません。
            </p>
            <div className="review-grid">
              {r.reviews.length === 0 && <p className="small muted">このお店の架空口コミはまだ登録されていません。</p>}
              {r.reviews.map((review) => (
                <article key={review.id}>
                  <strong>{review.nickname}</strong>
                  <span className="rating">
                    <Star size={13} fill="currentColor" />
                    {review.rating}
                  </span>
                  <p>{review.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="detail-section">
            <h2>
              <MapPin size={22} />
              お店の場所
            </h2>
            <p>{r.address}</p>
            <div className="demo-map">
              <svg
                viewBox="0 0 600 280"
                role="img"
                aria-label="架空の店舗位置を示すデモマップ"
              >
                <rect width="600" height="280" fill="#f0eee8" />
                <path
                  d="M0 70H600M0 190H600M150 0V280M420 0V280"
                  stroke="white"
                  strokeWidth="32"
                />
                <path d="M-20 260L620 20" stroke="#dee5dc" strokeWidth="48" />
                <path
                  d="M-20 260L620 20"
                  stroke="white"
                  strokeWidth="4"
                  strokeDasharray="8 5"
                />
                <text x="90" y="55" fill="#8b8b80" fontSize="14">
                  こもれび通り
                </text>
                <text x="435" y="225" fill="#8b8b80" fontSize="14">
                  {r.area}駅（架空）
                </text>
                <circle
                  cx={r.location.x * 6}
                  cy={r.location.y * 2.8}
                  r="21"
                  fill="#ee6850"
                />
                <text
                  x={r.location.x * 6}
                  y={r.location.y * 2.8 + 7}
                  textAnchor="middle"
                  fill="white"
                  fontSize="22"
                >
                  ●
                </text>
              </svg>
              <span>DEMO MAP · 実際の案内には使えません</span>
            </div>
          </section>
        </div>
        <aside className="match-sidebar">
          <div className="match-card">
            <div className="with-icon">
              <Users size={20} />
              <strong>
                {group?.name ?? `${data.profile.nickname}のおすすめ`}
              </strong>
            </div>
            {match ? (
              <>
                <div className="detail-score">
                  <span>おすすめ度</span>
                  <strong>
                    {match.score}
                    <small>%</small>
                  </strong>
                </div>
                <p className="with-icon green-text">
                  <Check size={16} />
                  登録されたアレルギー条件に一致
                </p>
                <Recommendations match={match} />
                {group ? (
                  <button
                    className="button primary full-width"
                    onClick={choose}
                  >
                    このお店に決定
                  </button>
                ) : (
                  <Link className="button primary full-width" to="/groups/new">
                    グループを作って探す
                  </Link>
                )}
              </>
            ) : (
              <>
                <h3>検索候補から除外されています</h3>
                {result.excluded[0]?.reasons.map((reason) => (
                  <p className="small" key={reason}>
                    {reason}
                  </p>
                ))}
              </>
            )}
            <p className="small muted">
              おすすめ度は好みに基づく目安です。アレルギーの安全性を示す数値ではありません。
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
export function Decision() {
  const { id } = useParams();
  const { data, update } = useStore();
  const group = data.groups.find((g) => g.id === id);
  const r = data.restaurants.find((r) => r.id === group?.selectedRestaurantId);
  if (!group || !r)
    return (
      <Empty title="お店がまだ決まっていません">
        <Link className="text-link" to={group ? `/search?group=${id}` : "/"}>
          候補のお店を探す
        </Link>
      </Empty>
    );
  const match = matchRestaurants([r], group.members, "", Infinity).matches[0];
  return (
    <div className="decision-page">
      <div className="decision-top">
        <span className="success-circle">
          <Check size={30} />
        </span>
        <div className="eyebrow">OUR NEXT TABLE</div>
        <h1>次のごはんは、ここに決まり。</h1>
        <p>
          {group.name} · {group.members.length}人
        </p>
      </div>
      <div className="decision-card">
        <FoodImage src={r.images[0]} alt={`${r.name}（写真はイメージ）`} />
        <div>
          <div className="eyebrow">
            {r.area} · {r.cuisine}
          </div>
          <h2>{r.name}</h2>
          <p>
            {yen(r.price)} / 人 · {r.openingHours}
          </p>
          <p className="muted">{r.description}</p>
          <Link className="text-link" to={`/restaurants/${r.id}?group=${id}`}>
            お店の詳細を見る
          </Link>
        </div>
      </div>
      {match ? (
        <section className="form-card">
          <h2>みんなにおすすめの一皿</h2>
          <p className="muted small">
            グループのおすすめ度 {match.score}% · 好みに基づく目安
          </p>
          <Recommendations match={match} />
        </section>
      ) : (
        <div className="notice">
          <ShieldCheck size={20} />
          <p>
            プロフィールまたは店舗情報が変更され、現在のアレルギー条件を満たさなくなりました。別のお店を選び直してください。
          </p>
        </div>
      )}
      <section className="form-card">
        <h2>店舗全体のアレルゲン情報</h2>
        <AllergenPanel restaurant={r} />
        <p className="small muted">{r.crossContactInfo}</p>
        <Notice />
      </section>
      <div className="form-actions">
        <Link className="button secondary" to={`/groups/${id}`}>
          グループへ戻る
        </Link>
        <Link
          className="button primary"
          to={`/search?group=${id}`}
          onClick={() =>
            update((d) => ({
              ...d,
              groups: d.groups.map((g) =>
                g.id === id ? { ...g, selectedRestaurantId: undefined } : g,
              ),
            }))
          }
        >
          お店を選び直す
        </Link>
      </div>
      <p className="muted small center">
        お店の決定はデモ内の記録です。予約や店舗への連絡は行いません。
      </p>
    </div>
  );
}

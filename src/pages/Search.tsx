import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search as SearchIcon,
  MapPin,
  Users,
  UserRound,
  SlidersHorizontal,
  ShieldCheck,
  ChevronDown,
  Utensils,
  Fish,
  Beef,
  Coffee,
  Soup,
  Pizza,
  Flame,
  Leaf,
  Check,
  Plus,
} from "lucide-react";
import { GroupCards } from "../components/GroupCards";
import { useStore } from "../hooks/useStore";
import { AREAS, BUDGETS, CUISINES, allergenLabel } from "../data/constants";
import { matchRestaurants } from "../lib/matching";
import { Avatar, RestaurantCard, Notice, Empty, yen } from "../components/ui";
const cuisineIcons = [
  Fish,
  Utensils,
  Soup,
  Pizza,
  Flame,
  Beef,
  Fish,
  Coffee,
  Leaf,
];
export default function SearchPage({ home = false }: { home?: boolean }) {
  const { data, update } = useStore();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const personal = params.get("mode") === "personal";
  const selectedGroup = params.get("group") || data.groups[0]?.id;
  const group = data.groups.find((g) => g.id === selectedGroup);
  const members = personal ? [data.profile] : (group?.members ?? []);
  const [area, setArea] = useState(params.get("area") ?? "渋谷");
  const [budget, setBudget] = useState(Number(params.get("budget") || 4000));
  const [cuisine, setCuisine] = useState("");
  const [searched, setSearched] = useState(false);
  const appliedArea = params.get("area") ?? "渋谷";
  const appliedBudget = Number(params.get("budget") || 4000);
  const result = matchRestaurants(
    data.restaurants,
    members,
    appliedArea,
    appliedBudget,
  );
  const matches = result.matches.filter(
    (m) => !cuisine || m.restaurant.cuisine === cuisine,
  );
  const allergies = [...new Set(members.flatMap((m) => m.allergies))];
  const choose = (id: string) => {
    if (!group || !result.matches.some((m) => m.restaurant.id === id)) return;
    if (
      update((d) => ({
        ...d,
        groups: d.groups.map((g) =>
          g.id === group.id ? { ...g, selectedRestaurantId: id } : g,
        ),
      }))
    )
      navigate(`/groups/${group.id}/decision`);
  };
  const setMode = (mode: string) => {
    setParams((p) => {
      const next = new URLSearchParams(p);
      next.set("mode", mode);
      return next;
    });
    setCuisine("");
  };
  return (
    <>
      <section className={`search-intro ${home ? "home-intro" : ""}`}>
        <div>
          <div className="eyebrow">
            <span />A TABLE FOR EVERYONE
          </div>
          <h1>
            {home ? (
              <>
                おいしい時間を、
                <br className="mobile-break" />
                <span>みんなで。</span>
              </>
            ) : (
              "みんなの「好き」で、お店を探そう。"
            )}
          </h1>
          <p>
            アレルギーも、好き嫌いも。みんなの食の好みから、ぴったりの一軒を。
          </p>
        </div>
        <Link className="intro-group" to="/groups">
          <div className="avatar-stack">
            {(group?.members ?? data.groups[0]?.members ?? [])
              .slice(0, 4)
              .map((m, i) => (
                <Avatar name={m.nickname} index={i} key={m.id} />
              ))}
          </div>
          <div>
            <span className="small muted">マイグループ</span>
            <strong>{data.groups.length}つのグループ</strong>
            <span className="small">グループ一覧を見る</span>
          </div>
          <ChevronDown size={16} />
        </Link>
      </section>
      {home && (
        <section className="home-groups" aria-label="マイグループ一覧">
          <div className="section-heading">
            <div>
              <h2>
                マイグループ{" "}
                <span className="count-badge">{data.groups.length}</span>
              </h2>
              <p className="small muted">
                ごはん会を選んで、お店探しをはじめよう。
              </p>
            </div>
            <Link className="text-link" to="/groups">
              一覧を見る →
            </Link>
          </div>
          {data.groups.length ? (
            <GroupCards
              groups={[...data.groups].reverse()}
              restaurants={data.restaurants}
            />
          ) : (
            <p className="muted">まだグループがありません。</p>
          )}
          <Link className="home-new-group" to="/groups/new">
            <Plus size={18} />
            新しいグループを作る
          </Link>
        </section>
      )}
      <div className="mode-tabs" aria-label="検索モード">
        <button
          className={!personal ? "active" : ""}
          onClick={() => setMode("group")}
        >
          <Users size={18} />
          みんなで探す
        </button>
        <button
          className={personal ? "active" : ""}
          onClick={() => setMode("personal")}
        >
          <UserRound size={18} />
          ひとりで探す
        </button>
        <Link className="quick-group-link" to="/groups/new">
          <Plus size={17} />
          新しいグループを作る
        </Link>
      </div>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setParams((p) => {
            const next = new URLSearchParams(p);
            next.set("area", area);
            next.set("budget", String(budget));
            return next;
          });
          setSearched(true);
        }}
      >
        <label>
          <MapPin size={20} />
          <div>
            <span>エリア</span>
            <select
              aria-label="エリア"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">すべてのエリア</option>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
        </label>
        <label>
          <Utensils size={20} />
          <div>
            <span>予算・1人あたり</span>
            <select
              aria-label="予算上限"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            >
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  {yen(b)}まで
                </option>
              ))}
            </select>
          </div>
        </label>
        <label>
          <Users size={20} />
          <div>
            <span>{personal ? "プロフィール" : "グループ"}</span>
            {personal ? (
              <Link className="search-profile" to="/profile">
                {data.profile.nickname}の食の好み
              </Link>
            ) : (
              <select
                aria-label="検索するグループ"
                value={selectedGroup ?? ""}
                onChange={(e) =>
                  setParams((p) => {
                    const next = new URLSearchParams(p);
                    next.set("group", e.target.value);
                    return next;
                  })
                }
              >
                {data.groups.map((g) => (
                  <option value={g.id} key={g.id}>
                    {g.name} · {g.members.length}人
                  </option>
                ))}
              </select>
            )}
          </div>
        </label>
        <button className="button primary search-submit">
          <SearchIcon size={19} />
          お店を探す
        </button>
      </form>
      <div className="search-safety">
        <ShieldCheck size={17} />
        <p>
          {members.length}人のアレルギーを検索に反映
          {allergies.length > 0 && (
            <span>：{allergies.map(allergenLabel).join("・")}</span>
          )}
        </p>
        <Link
          to={
            personal
              ? "/profile"
              : group
                ? `/groups/${group.id}`
                : "/groups/new"
          }
        >
          食の好みを確認
        </Link>
      </div>
      <div className="cuisine-row">
        <button
          className={!cuisine ? "active" : ""}
          onClick={() => setCuisine("")}
        >
          <Utensils size={25} />
          <span>すべて</span>
        </button>
        {CUISINES.map((c, i) => {
          const Icon = cuisineIcons[i];
          return (
            <button
              key={c}
              className={cuisine === c ? "active" : ""}
              onClick={() => setCuisine(c)}
            >
              <Icon size={25} />
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      <section className="results-section">
        <div className="section-heading">
          <div>
            <h2>
              {personal ? "あなた" : "みんな"}におすすめのお店
              <span className="result-count">{matches.length}件</span>
            </h2>
            <p>
              {appliedArea || "すべてのエリア"} · {yen(appliedBudget)}まで ·
              登録されたアレルギー条件に一致
            </p>
          </div>
          <span className="sort-label">
            <SlidersHorizontal size={16} />
            おすすめ度順
          </span>
        </div>
        {searched && (
          <div className="sr-only" role="status">
            検索が完了しました。おすすめは{matches.length}件です。
          </div>
        )}
        {matches.length > 0 ? (
          <div className="restaurant-grid">
            {matches.map((m, i) => (
              <RestaurantCard
                match={m}
                rank={i}
                groupId={!personal ? group?.id : undefined}
                onSelect={() => choose(m.restaurant.id)}
                key={m.restaurant.id}
              />
            ))}
          </div>
        ) : (
          <Empty title="条件に一致するお店がありません">
            <p>
              アレルギー条件は緩和せず、エリアや予算、ジャンルを変更して探してください。
            </p>
            {!members.length && (
              <Link to="/groups/new" className="text-link">
                グループを作成
              </Link>
            )}
          </Empty>
        )}
      </section>
      {result.excluded.length > 0 && (
        <details className="excluded-section">
          <summary>
            <span>
              <ShieldCheck size={20} />
              <strong>候補から除外したお店</strong>
              <span className="tag neutral">{result.excluded.length}件</span>
            </span>
            <ChevronDown size={19} />
          </summary>
          <p className="muted small">
            使用あり・未確認のアレルゲンは、メニューや好みの点数に関係なく候補から除外します。
          </p>
          <div className="excluded-grid">
            {result.excluded.map(({ restaurant: r, reasons }) => (
              <div key={r.id}>
                <Link to={`/restaurants/${r.id}`}>
                  <strong>{r.name}</strong>
                </Link>
                {reasons.map((reason) => (
                  <p key={reason}>{reason}</p>
                ))}
              </div>
            ))}
          </div>
        </details>
      )}
      <div className="bottom-links">
        <Link to="/groups/new">
          <Plus size={17} />
          新しいグループを作る
        </Link>
        <Link to="/restaurants/new">飲食店の方へ · 店舗を登録する</Link>
      </div>
      <Notice compact />
    </>
  );
}

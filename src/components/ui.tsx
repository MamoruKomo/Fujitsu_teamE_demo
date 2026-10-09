import { AlertTriangle, Check, Utensils, X, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { useEffect, useRef, type ReactNode } from "react";
import type { RestaurantMatch, Restaurant } from "../types";
import {
  ALLERGENS,
  allergenLabel,
  STATUS_LABELS,
  SAFETY_NOTICE,
} from "../data/constants";
export const yen = (amount: number) => `¥${amount.toLocaleString("ja-JP")}`;
export function FoodImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = `${import.meta.env.BASE_URL}images/fallback.svg`;
      }}
    />
  );
}
export function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  return (
    <span className={`avatar avatar-${index % 4}`} aria-label={name}>
      {name.slice(0, 1)}
    </span>
  );
}
export function Notice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`notice ${compact ? "compact" : ""}`}>
      <AlertTriangle size={17} />
      <p>{SAFETY_NOTICE}</p>
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Utensils size={30} />
      </span>
      <h2>{title}</h2>
      <div className="muted">{children}</div>
      <Link to="/" className="button secondary">
        ホームへ
      </Link>
    </div>
  );
}
export function Tags({
  options,
  selected,
  onChange,
  tone = "coral",
}: {
  options: readonly (string | readonly [string, string])[];
  selected: string[];
  onChange: (values: string[]) => void;
  tone?: string;
}) {
  return (
    <div className="tags">
      {options.map((option) => {
        const [id, label] =
          typeof option === "string" ? [option, option] : option;
        const active = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            className={`tag selectable ${active ? `selected ${tone}` : ""}`}
            aria-pressed={active}
            onClick={() =>
              onChange(
                active ? selected.filter((v) => v !== id) : [...selected, id],
              )
            }
          >
            {active && <Check size={13} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = [...document.querySelectorAll("header, main, footer")];
    background.forEach((el) => el.setAttribute("inert", ""));
    ref.current?.querySelector<HTMLElement>("input, button")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const targets = [
        ...(ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select, textarea, [tabindex="0"]',
        ) ?? []),
      ].filter((el) => el.getClientRects().length > 0);
      const first = targets[0],
        last = targets[targets.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = previousOverflow;
      background.forEach((el) => el.removeAttribute("inert"));
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="modal-title">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="閉じる" onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}
export function AllergenPanel({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="allergen-panel">
      {(["used", "not_used", "unknown"] as const).map((status) => (
        <div key={status}>
          <h4>
            <span className={`status-symbol ${status}`}>
              {status === "not_used" ? (
                <Check size={14} />
              ) : status === "unknown" ? (
                "?"
              ) : (
                "!"
              )}
            </span>
            {STATUS_LABELS[status]}
          </h4>
          <div className="tags">
            {ALLERGENS.filter(
              ([id]) =>
                (restaurant.allergenStatuses[id] ?? "unknown") === status,
            ).map(([id, name]) => (
              <span className={`tag ${status}`} key={id}>
                {name}
              </span>
            ))}
            {!ALLERGENS.some(
              ([id]) =>
                (restaurant.allergenStatuses[id] ?? "unknown") === status,
            ) && <span className="muted small">該当なし</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
export function Recommendations({ match }: { match: RestaurantMatch }) {
  return (
    <div className="recommendation-list">
      {match.recommendations.map((rec, i) => (
        <div className="recommendation" key={rec.member.id}>
          <Avatar name={rec.member.nickname} index={i} />
          <div>
            <strong>
              {rec.member.nickname}
              <span className="muted small">さん</span>
            </strong>
            <p>{rec.menu.name}</p>
            <span className="muted small">{rec.reasons.join(" / ")}</span>
          </div>
          <div className="member-score">
            <strong>
              {rec.score}
              <small>%</small>
            </strong>
            <span>満足度</span>
          </div>
        </div>
      ))}
    </div>
  );
}
export function RestaurantCard({
  match,
  rank,
  groupId,
  onSelect,
}: {
  match: RestaurantMatch;
  rank: number;
  groupId?: string;
  onSelect?: () => void;
}) {
  const { restaurant: r } = match;
  return (
    <article className="restaurant-card">
      <Link
        to={`/restaurants/${r.id}${groupId ? `?group=${groupId}` : "?personal=1"}`}
        className="card-image-link"
      >
        <FoodImage src={r.images[0]} alt={`${r.name}の料理（イメージ）`} />
        <span className={`card-label ${rank === 0 ? "top" : ""}`}>
          <Check size={13} />
          {rank === 0 ? (groupId ? "みんなに一番おすすめ" : "あなたに一番おすすめ") : "アレルギー登録条件に一致"}
        </span>
        <span className="image-count">1 / {r.images.length}</span>
      </Link>
      <div className="card-body">
        <div className="card-heading">
          <Link
            to={`/restaurants/${r.id}${groupId ? `?group=${groupId}` : "?personal=1"}`}
          >
            <h3>{r.name}</h3>
          </Link>
          <span className="rating">
            {r.reviews.length > 0 ? <><Star size={13} fill="currentColor" />{r.rating.toFixed(1)}</> : "新規登録"}
          </span>
        </div>
        <p className="card-meta">
          {r.area} · {r.cuisine}
        </p>
        <div className="card-score">
          <span>{groupId ? "みんなの" : "あなたの"}おすすめ度</span>
          <strong>
            {match.score}
            <small>%</small>
          </strong>
        </div>
        <div className="score-track">
          <span style={{ width: `${match.score}%` }} />
        </div>
        <p className="card-reason">
          {match.recommendations.filter((rec) =>
            rec.reasons.some((reason) => reason.startsWith("好き")),
          ).length > 0
            ? `${match.recommendations.filter((rec) => rec.reasons.some((reason) => reason.startsWith("好き"))).length}人の「好き」が見つかるお店`
            : "登録された食の好みで比較しています"}
        </p>
        <div className="card-price">
          <span>
            <strong>{yen(r.price)}</strong>
            <small> / 人（目安）</small>
          </span>
          <details>
            <summary>おすすめメニュー</summary>
            <div className="card-recs">
              {match.recommendations.map((rec) => (
                <p key={rec.member.id}>
                  <b>
                    {rec.member.nickname} {rec.score}%
                  </b>
                  <span>{rec.menu.name}</span>
                </p>
              ))}
            </div>
          </details>
        </div>
        {groupId && (
          <button className="card-decide" onClick={onSelect}>
            このお店に決定
          </button>
        )}
      </div>
    </article>
  );
}
export function ProfileSummary({
  values,
  allergies = false,
}: {
  values: string[];
  allergies?: boolean;
}) {
  return (
    <div className="tags">
      {values.length ? (
        values.map((v) => (
          <span className={`tag ${allergies ? "used" : "neutral"}`} key={v}>
            {allergies ? allergenLabel(v) : v}
          </span>
        ))
      ) : (
        <span className="muted small">登録なし</span>
      )}
    </div>
  );
}

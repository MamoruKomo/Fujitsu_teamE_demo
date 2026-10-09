import { useLocale } from "../hooks/useLocale";
import { allergyImpact } from "../lib/matching";
import { allergenLabel, STATUS_LABELS } from "../data/constants";
import type { Restaurant, UserProfile } from "../types";

export function AllergyImpact({
  restaurant,
  members,
}: {
  restaurant: Restaurant;
  members: UserProfile[];
}) {
  const { t } = useLocale();
  const impact = allergyImpact(restaurant, members);
  return (
    <div className="allergy-impact">
      <div className="allergy-impact-heading">
        <span>{t("アレルギー条件に該当する参加者")}</span>
        <b>{impact.percent}%</b>
      </div>
      <div className="allergy-impact-bar" aria-hidden="true">
        <span style={{ width: `${impact.percent}%` }} />
      </div>
      <p>
        {impact.affected} / {impact.total} {t("人")}
      </p>
      {impact.allergens.map(({ id, status, count }) => (
        <div className="allergy-impact-row" key={id}>
          <span>
            {t(allergenLabel(id))} · {t(STATUS_LABELS[status])}
          </span>
          <span>
            {count} / {impact.total} {t("人")} ·{" "}
            {Math.round((count / impact.total) * 100)}%
          </span>
        </div>
      ))}
      {!impact.affected && (
        <p>
          {t(
            "店舗全体のアレルギー条件への該当なし。メニューの確認状況などで除外されています。",
          )}
        </p>
      )}
    </div>
  );
}

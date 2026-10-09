import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Check,
  Copy,
  Users,
  Plus,
  Pencil,
  ShieldCheck,
  Search,
  Link as LinkIcon,
} from "lucide-react";
import { useStore } from "../hooks/useStore";
import type { UserProfile } from "../types";
import { ProfileForm } from "../components/ProfileForm";
import { Avatar, Empty, Modal, ProfileSummary } from "../components/ui";
export function CreateGroup() {
  const { data, update } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const save = (profile: UserProfile) => {
    const id = crypto.randomUUID();
    if (
      update((d) => ({
        ...d,
        groups: [
          ...d.groups,
          { id, name: name.trim(), hostId: profile.id, members: [profile] },
        ],
      }))
    )
      navigate(`/groups/${id}`);
  };
  return (
    <div className="narrow-page">
      <Link className="back-link" to="/">
        ホームへ戻る
      </Link>
      <div className="page-title">
        <div className="eyebrow">NEW GROUP</div>
        <h1>
          みんなの食卓を、
          <br />
          ここから。
        </h1>
        <p>グループを作って、それぞれの食の好みを集めましょう。</p>
      </div>
      <div className="form-card">
        {!started ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStarted(true);
            }}
          >
            <label className="field">
              グループ名
              <input
                autoFocus
                required
                maxLength={48}
                pattern={".*\\S.*"}
                placeholder="例：金曜日のごはん会"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <p className="muted small">
              招待URLは同じブラウザの別タブで利用できます。別端末や別ブラウザには共有されません。
            </p>
            <button className="button primary">幹事のプロフィールを登録</button>
          </form>
        ) : (
          <>
            <h2>{name}</h2>
            <p className="muted">まずは幹事の食の好みを教えてください。</p>
            <ProfileForm
              initial={{ ...data.profile, id: crypto.randomUUID() }}
              onSave={save}
              submitLabel="グループを作成"
            />
          </>
        )}
      </div>
    </div>
  );
}
export function JoinGroup() {
  const { id } = useParams();
  const { data, update } = useStore();
  const navigate = useNavigate();
  const group = data.groups.find((g) => g.id === id);
  if (!group)
    return (
      <Empty title="このグループが見つかりません">
        <p>
          招待URLを確認してください。同じブラウザの保存領域にグループがある場合のみ参加できます。
        </p>
      </Empty>
    );
  return (
    <div className="narrow-page">
      <div className="page-title">
        <div className="eyebrow">YOU'RE INVITED</div>
        <h1>
          「{group.name}」<br />
          に参加しよう。
        </h1>
        <p>ニックネームと食の好みだけ。メールやパスワードは不要です。</p>
      </div>
      <div className="form-card">
        <ProfileForm
          onSave={(profile) => {
            if (
              update((d) => {
                const current = d.groups.find((g) => g.id === id);
                if (!current) throw new Error("missing group");
                return {
                  ...d,
                  groups: d.groups.map((g) =>
                    g.id === id
                      ? { ...g, members: [...g.members, profile] }
                      : g,
                  ),
                };
              })
            )
              navigate(`/groups/${id}`);
          }}
          submitLabel="グループに参加"
        />
      </div>
    </div>
  );
}
export function PersonalProfile() {
  const { data, update } = useStore();
  const navigate = useNavigate();
  return (
    <div className="narrow-page">
      <div className="page-title">
        <div className="eyebrow">YOUR TASTE</div>
        <h1>あなたの食の好み</h1>
        <p>
          個人検索に反映されます。グループ内のプロフィールはグループ画面で編集できます。
        </p>
      </div>
      <div className="form-card">
        <ProfileForm
          initial={data.profile}
          onSave={(profile) => {
            if (update((d) => ({ ...d, profile })))
              navigate("/search?mode=personal");
          }}
        />
      </div>
    </div>
  );
}
export function GroupManagement() {
  const { id } = useParams();
  const { data, update } = useStore();
  const group = data.groups.find((g) => g.id === id);
  const [editing, setEditing] = useState<UserProfile | "new" | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const invitation = `${window.location.origin}${import.meta.env.BASE_URL}#/join/${id}`;
  if (!group) return <Empty title="グループが見つかりません" />;
  const save = (profile: UserProfile) => {
    if (
      update((d) => {
        if (!d.groups.some((g) => g.id === id))
          throw new Error("missing group");
        return {
          ...d,
          groups: d.groups.map((g) =>
            g.id === id
              ? {
                  ...g,
                  members:
                    editing === "new"
                      ? [...g.members, profile]
                      : g.members.map((m) =>
                          m.id === profile.id ? profile : m,
                        ),
                }
              : g,
          ),
        };
      })
    )
      setEditing(null);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invitation);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
    }
  };
  return (
    <>
      <Link className="back-link" to="/">
        ホームへ戻る
      </Link>
      <div className="page-title inline-title">
        <div>
          <div className="eyebrow">YOUR GROUP</div>
          <h1>{group.name}</h1>
          <p>{group.members.length}人の食の好みを、ひとつの食卓に。</p>
        </div>
        <Link className="button primary" to={`/search?group=${id}`}>
          <Search size={18} />
          みんなでお店を探す
        </Link>
      </div>
      <div className="invite-banner">
        <div>
          <LinkIcon size={22} />
          <div>
            <h3>食の好みを、招待リンクで集めよう</h3>
            <p>
              同じブラウザの別タブで開いて参加できます。別端末との同期はありません。
            </p>
          </div>
        </div>
        <button className="button secondary" onClick={copy}>
          {copied ? <Check size={17} /> : <Copy size={17} />}{" "}
          {copied ? "コピーしました" : "招待URLをコピー"}
        </button>
        <label className="invite-link">
          <span className="sr-only">招待URL</span>
          <input
            readOnly
            value={invitation}
            onFocus={(e) => e.target.select()}
          />
        </label>
        {copyFailed && (
          <p role="status">
            コピーできませんでした。上のURLを選択してコピーしてください。
          </p>
        )}
        <Link className="text-link small" to={`/join/${id}`} target="_blank">
          別タブで参加画面を開く
        </Link>
      </div>
      <div className="section-heading">
        <h2>
          <Users size={22} />
          参加者<span className="result-count">{group.members.length}人</span>
        </h2>
        <button className="button secondary" onClick={() => setEditing("new")}>
          <Plus size={17} />
          参加者を追加
        </button>
      </div>
      <div className="member-grid">
        {group.members.map((m, i) => (
          <article className="member-card" key={m.id}>
            <div className="member-header">
              <Avatar name={m.nickname} index={i} />
              <div>
                <h3>{m.nickname}</h3>
                <span className="small muted">
                  {m.id === group.hostId ? "幹事" : "ゲスト"}
                </span>
              </div>
              <button
                className="icon-button"
                aria-label={`${m.nickname}のプロフィールを編集`}
                onClick={() => setEditing(m)}
              >
                <Pencil size={17} />
              </button>
            </div>
            <div className="member-allergies">
              <h4>
                <ShieldCheck size={16} />
                アレルギー
              </h4>
              <ProfileSummary values={m.allergies} allergies />
            </div>
            <h4>好きな食材</h4>
            <ProfileSummary values={m.likedIngredients} />
            <h4>苦手な食材</h4>
            <ProfileSummary values={m.dislikedIngredients} />
            <h4>好きなジャンル</h4>
            <ProfileSummary values={m.likedCuisines} />
            <h4>苦手なジャンル</h4>
            <ProfileSummary values={m.dislikedCuisines} />
          </article>
        ))}
      </div>
      {group.selectedRestaurantId && (
        <Link className="decision-banner" to={`/groups/${id}/decision`}>
          <Check size={22} />
          <span>決定したお店を確認する</span>
        </Link>
      )}
      {editing && (
        <Modal
          title={editing === "new" ? "参加者を追加" : "食の好みを編集"}
          onClose={() => setEditing(null)}
        >
          <ProfileForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? undefined : editing}
            onSave={save}
          />
        </Modal>
      )}
    </>
  );
}
